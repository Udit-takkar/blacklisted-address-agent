/* eslint-disable */
import _m0 from "protobufjs/minimal";

export const protobufPackage = "address";

export interface AddressRequest {
  address: string;
}

export interface AddressResponse {
  isValid: boolean;
  normalizedAddress: string;
}

function createBaseAddressRequest(): AddressRequest {
  return { address: "" };
}

export const AddressRequest = {
  encode(message: AddressRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.address !== "") {
      writer.uint32(10).string(message.address);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AddressRequest {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddressRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 10) {
            break;
          }

          message.address = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AddressRequest {
    return { address: isSet(object.address) ? globalThis.String(object.address) : "" };
  },

  toJSON(message: AddressRequest): unknown {
    const obj: any = {};
    if (message.address !== "") {
      obj.address = message.address;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<AddressRequest>, I>>(base?: I): AddressRequest {
    return AddressRequest.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<AddressRequest>, I>>(object: I): AddressRequest {
    const message = createBaseAddressRequest();
    message.address = object.address ?? "";
    return message;
  },
};

function createBaseAddressResponse(): AddressResponse {
  return { isValid: false, normalizedAddress: "" };
}

export const AddressResponse = {
  encode(message: AddressResponse, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.isValid === true) {
      writer.uint32(8).bool(message.isValid);
    }
    if (message.normalizedAddress !== "") {
      writer.uint32(18).string(message.normalizedAddress);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): AddressResponse {
    const reader = input instanceof _m0.Reader ? input : _m0.Reader.create(input);
    let end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseAddressResponse();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
        case 1:
          if (tag !== 8) {
            break;
          }

          message.isValid = reader.bool();
          continue;
        case 2:
          if (tag !== 18) {
            break;
          }

          message.normalizedAddress = reader.string();
          continue;
      }
      if ((tag & 7) === 4 || tag === 0) {
        break;
      }
      reader.skipType(tag & 7);
    }
    return message;
  },

  fromJSON(object: any): AddressResponse {
    return {
      isValid: isSet(object.isValid) ? globalThis.Boolean(object.isValid) : false,
      normalizedAddress: isSet(object.normalizedAddress) ? globalThis.String(object.normalizedAddress) : "",
    };
  },

  toJSON(message: AddressResponse): unknown {
    const obj: any = {};
    if (message.isValid === true) {
      obj.isValid = message.isValid;
    }
    if (message.normalizedAddress !== "") {
      obj.normalizedAddress = message.normalizedAddress;
    }
    return obj;
  },

  create<I extends Exact<DeepPartial<AddressResponse>, I>>(base?: I): AddressResponse {
    return AddressResponse.fromPartial(base ?? ({} as any));
  },
  fromPartial<I extends Exact<DeepPartial<AddressResponse>, I>>(object: I): AddressResponse {
    const message = createBaseAddressResponse();
    message.isValid = object.isValid ?? false;
    message.normalizedAddress = object.normalizedAddress ?? "";
    return message;
  },
};

export interface AddressVerifier {
  VerifyAddress(request: AddressRequest): Promise<AddressResponse>;
}

export const AddressVerifierServiceName = "address.AddressVerifier";
export class AddressVerifierClientImpl implements AddressVerifier {
  private readonly rpc: Rpc;
  private readonly service: string;
  constructor(rpc: Rpc, opts?: { service?: string }) {
    this.service = opts?.service || AddressVerifierServiceName;
    this.rpc = rpc;
    this.VerifyAddress = this.VerifyAddress.bind(this);
  }
  VerifyAddress(request: AddressRequest): Promise<AddressResponse> {
    const data = AddressRequest.encode(request).finish();
    const promise = this.rpc.request(this.service, "VerifyAddress", data);
    return promise.then((data) => AddressResponse.decode(_m0.Reader.create(data)));
  }
}

interface Rpc {
  request(service: string, method: string, data: Uint8Array): Promise<Uint8Array>;
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined;

export type DeepPartial<T> = T extends Builtin ? T
  : T extends globalThis.Array<infer U> ? globalThis.Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U> ? ReadonlyArray<DeepPartial<U>>
  : T extends {} ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}
