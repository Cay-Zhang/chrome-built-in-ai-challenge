import * as handlers from '.';
import type { Message } from '.';
import type { Jsonifiable, Jsonify, Promisable, SetReturnType } from 'type-fest';

type _ = typeof handlers;

type ClientMethod<Function_ extends (...arguments_: any[]) => any> = SetReturnType<
  Function_,
  Promise<Jsonify<Awaited<ReturnType<Function_>>>>
>;

type Client<T extends Record<string, (...args: any[]) => Promisable<Jsonifiable>>> = {
  [K in keyof T]: ClientMethod<T[K]>;
};

export const runtime: Client<typeof handlers> = Object.fromEntries(
  Object.entries(handlers).map(([prop, handler]) => [
    prop,
    async (...args: Jsonifiable[]) => {
      const result = await chrome.runtime.sendMessage({ rpcId: prop, args } as Message);
      console.log('rpcId:', prop, 'args:', args, 'result:', result);
      return result;
    },
  ]),
) as Client<typeof handlers>;
