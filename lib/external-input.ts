export function parseJson(text:string):unknown{
 return JSON.parse(text) as unknown;
}

export function isRecord(value:unknown):value is Record<string,unknown>{
 return typeof value==='object'&&value!==null&&!Array.isArray(value);
}

export function errorMessage(error:unknown,fallback:string){
 return error instanceof Error?error.message:fallback;
}
