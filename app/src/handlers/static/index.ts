import { staticFileData } from "./fileinfo";
import { staticHandlerFactory } from "./static";

export const staticHandler = staticHandlerFactory(staticFileData);

export { indexHandler } from "./indexhandler";
