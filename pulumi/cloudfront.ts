import * as aws from "@pulumi/aws";
import * as aws_native from "@pulumi/aws-native";
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

const targetZone = config.require("targetZone");
const targetDomain = config.require("targetDomain");

const targetDomainFull = `${targetDomain}.${targetZone}`;

const hostedZone = new aws.route53.Zone("zone", {
  name: targetZone,
});

const logsBucket = new aws_native.s3.Bucket("requestLogs", {
  bucketName: `${targetDomainFull}-logs`,
  ownershipControls: {
    rules: [
      {
        objectOwnership:
          aws_native.s3.BucketOwnershipControlsRuleObjectOwnership
            .BucketOwnerPreferred,
      },
    ],
  },
  publicAccessBlockConfiguration: {
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
});

const awsUsEast = new aws.Provider("aws-us-east-1", {
  profile: aws_native.config.profile,
  region: "us-east-1",
});

const certificate = new aws.acm.Certificate(
  `${targetDomain}-cert`,
  {
    domainName: targetDomainFull,
    validationMethod: "DNS",
  },
  {
    provider: awsUsEast,
  },
);

const certificateValidationDomain = new aws.route53.Record(
  `${targetDomain}-cert-validation`,
  {
    name: certificate.domainValidationOptions[0].resourceRecordName,
    zoneId: hostedZone.zoneId,
    type: certificate.domainValidationOptions[0].resourceRecordType,
    records: [certificate.domainValidationOptions[0].resourceRecordValue],
    ttl: 60,
  },
);

const certificateValidation = new aws.acm.CertificateValidation(
  "certificateValidation",
  {
    certificateArn: certificate.arn,
    validationRecordFqdns: [certificateValidationDomain.fqdn],
  },
  {
    provider: awsUsEast,
  },
);

const origin = {
  customOriginConfig: {
    originProtocolPolicy: "https-only",
  },
  domainName: `api.${targetDomainFull}`,
  id: `api-${targetDomainFull}`,
} satisfies aws_native.types.input.cloudfront.DistributionOriginArgs;

const cachePolicy = new aws_native.cloudfront.CachePolicy(
  "coldoutsi.de-cache-policy",
  {
    cachePolicyConfig: {
      name: "coldoutsi-de-cache-policy",
      defaultTtl: 60 * 60, // 1 hour
      minTtl: 60, // 1 minute
      maxTtl: 60 * 60 * 24, // 1 day
      parametersInCacheKeyAndForwardedToOrigin: {
        cookiesConfig: {
          cookieBehavior: "none",
        },
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true,
        headersConfig: {
          headerBehavior: "whitelist",
          headers: [
            "Accept",
            "Accept-Language",
            "CloudFront-Viewer-Latitude",
            "CloudFront-Viewer-Longitude",
            "Content-Type",
            "If-None-Match",
            "Last-Modified",
          ],
        },
        queryStringsConfig: {
          queryStringBehavior: "whitelist",
          queryStrings: ["format"],
        },
      },
    },
  },
);

const cloudFrontDistribution = new aws_native.cloudfront.Distribution(
  "coldoutsi.de-dev",
  {
    distributionConfig: {
      aliases: [targetDomainFull],
      defaultCacheBehavior: {
        cachePolicyId: cachePolicy.id,
        targetOriginId: origin.id,
        viewerProtocolPolicy: "redirect-to-https",
      },
      enabled: true,
      httpVersion: "http3",
      ipv6Enabled: true,
      logging: {
        bucket: logsBucket.domainName,
        includeCookies: false,
      },
      origins: [origin],
      // https://aws.amazon.com/cloudfront/pricing/
      priceClass: "PriceClass_100",
      viewerCertificate: {
        acmCertificateArn: certificate.arn,
        sslSupportMethod: "sni-only",
      },
    },
  },
);

const aliasRecord = new aws.route53.Record(`dns-${targetDomainFull}`, {
  name: targetDomainFull,
  zoneId: hostedZone.zoneId,
  type: "A",
  aliases: [
    {
      evaluateTargetHealth: true,
      name: cloudFrontDistribution.domainName,
      zoneId: "Z2FDTNDATAQYW2", // CloudFront zone ID
    },
  ],
});
