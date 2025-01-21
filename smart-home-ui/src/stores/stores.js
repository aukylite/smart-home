import { readable, writable } from "svelte/store";
import { nanoid } from 'nanoid'


let user = localStorage.getItem("userUuid");

if (!user) {
  user = nanoid(); //.toString(); 
  //user = crypto.randomUUID().toString();
  localStorage.setItem("userUuid", user);
} 


let devices = writable({});

export const userUuid = readable(user);

export {devices};