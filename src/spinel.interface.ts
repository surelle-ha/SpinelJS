import { HTTPMethod } from "spinel.type.js";

export interface SpinelOption {
    globalVersion?: string;
    globalPrefix?: string;
}

export interface EndpointOption {
    name: string;
    method: HTTPMethod;
    route: string;
    useFunction: (req: any) => Response | Promise<Response>;
}

export interface ModuleOption {
    name: string;
    useSet: EndpointOption[];
}

export interface ListenOption {
    hostname: string;
    port: number;
}
