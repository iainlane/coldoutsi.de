import { staticFileData } from "@/lib/static";
import { staticHandlerFactory } from "./static";

export const staticHandler = staticHandlerFactory(staticFileData);

export { indexHandler } from "./indexhandler";
