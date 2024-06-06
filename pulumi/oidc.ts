import * as pulumi from "@pulumi/pulumi";
import * as aws_native from "@pulumi/aws-native";

const config = new pulumi.Config();

const accountId = (await aws_native.getAccountId()).accountId;
const region = (await aws_native.getRegion()).region;

const gitHubRepo = config.require("gitHubRepo");
const targetZone = config.require("targetZone");
const stack = pulumi.getStack();

const oidcAudience = "token.actions.githubusercontent.com";
const oidcProvider = new aws_native.iam.OidcProvider("github-oidc", {
  clientIdList: [`${targetZone}-${stack}`],
  thumbprintList: [
    // GitHub's thumbprints as of 2024-06-06. According to AWS's documentation,
    // these aren't used for validation.
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ],
  url: `https://${oidcAudience}`,
});

// A map of the audience to the client ID, used in the role's trust policy to
// ensure that only this OIDC provider can assume the role.
const audiences = oidcProvider.clientIdList.apply(
  (ids) =>
    ids && Object.fromEntries(ids.map((id) => [`${oidcAudience}:aud`, id])),
);

const oidcRole = new aws_native.iam.Role("oidcRole", {
  assumeRolePolicyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          Federated: oidcProvider.arn,
        },
        Action: "sts:AssumeRoleWithWebIdentity",
        Condition: {
          StringEquals: {
            ...audiences,
            // [`${oidcAudience}:sub`]: `repo:${gitHubRepo}:ref:refs/heads/main`,
          },
          StringLike: {
            [`${oidcAudience}:sub`]: `repo:${gitHubRepo}:*`,
          },
        },
      },
    ],
  },
});

// read from and write to the state bucket
const stateBucketName = "coldoutsi.de-pulumi-state";
const stateBucketPolicy = new aws_native.s3.BucketPolicy("stateBucketPolicy", {
  bucket: stateBucketName,
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: {
          AWS: oidcRole.arn,
        },
        Action: ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
        Resource: [
          `arn:aws:s3:::${stateBucketName}/*`,
          `arn:aws:s3:::${stateBucketName}`,
        ],
      },
    ],
  },
});

// decrypt the kms key used to encrypt secrets in the state bucket
const stateBucketAlias = aws_native.kms.Alias.get(
  "stateBucketKey",
  "alias/pulumi-secrets",
);
const stateBucketKey = aws_native.kms.Key.get(
  "stateBucketKey",
  stateBucketAlias.targetKeyId,
);

// decrypt the key
const kmsPolicy = new aws_native.iam.RolePolicy("kmsReadOnlyPolicy", {
  policyDocument: {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: ["kms:Decrypt"],
        Resource: stateBucketKey.arn,
      },
      {
        Effect: "Allow",
        Action: ["kms:DescribeKey"],
        Resource: `arn:aws:kms:${region}:${accountId}:key/*`,
      },
      {
        Effect: "Allow",
        Action: ["kms:ListAliases", "kms:ListKeys"],
        Resource: "*",
      },
    ],
  },
  roleName: oidcRole.id,
});

// get resources using the cloud control api
const cloudControlGetResourcesPolicy = new aws_native.iam.RolePolicy(
  "cloudControlGetResourcesPolicy",
  {
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: ["cloudformation:GetResource"],
          Resource: "*",
        },
      ],
    },
    roleName: oidcRole.id,
  },
);

export const oidc = {
  audience: oidcProvider.clientIdList,
  roleArn: oidcRole.arn,
};
