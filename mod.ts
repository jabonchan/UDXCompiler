import { compile } from "./lib/compile.ts";
import { way } from "./deps.ts";

if (Deno.build.standalone) Deno.chdir(way.dirpath(way.execPath()))
else Deno.chdir(way.dirpath(import.meta.url));

await compile();