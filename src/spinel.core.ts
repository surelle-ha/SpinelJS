import { createServer } from "http";
import { parse } from "url";
import type {
    EndpointOption,
    ListenOption,
    ModuleOption,
    SpinelOption,
} from "./spinel.interface.js";
import type { HTTPMethod } from "./spinel.type.js";

export class Spinel {
    private endpoints: Map<string, EndpointOption>;
    private globalVersion: string;
    private globalPrefix: string;

    constructor(private readonly spinelOption: SpinelOption) {
        this.endpoints = new Map();
        this.globalVersion = this.spinelOption.globalVersion;
        this.globalPrefix = this.spinelOption.globalPrefix;
    }

    private routeResolver(route: string): string {
        if (!route) throw new Error("Route must not be empty");

        const prefix = this.globalPrefix || "";
        const version = this.globalVersion || "";

        return `/${[prefix, version, route].filter(Boolean).join("/")}`;
    }

    private getEndpointKey(method: HTTPMethod, route: string): string {
        return `${method}:${route}`;
    }

    public createModule(modules: ModuleOption | ModuleOption[]): void {
        const moduleArray = Array.isArray(modules) ? modules : [modules];
        for (const module of moduleArray) {
            for (const endpoint of module.useSet) {
                const key = this.getEndpointKey(
                    endpoint.method,
                    this.routeResolver(endpoint.route) || endpoint.route
                );
                this.endpoints.set(key, endpoint);
            }
        }
    }

    public listen(option: ListenOption): void {
        const server = createServer(async (req, res) => {
            try {
                const url = parse(req.url || "", true);
                const method = (req.method || "").toUpperCase() as HTTPMethod;
                const key = this.getEndpointKey(method, url.pathname || "");

                const endpoint = this.endpoints.get(key);

                if (endpoint) {
                    const response = await endpoint.useFunction(req);

                    // Convert Headers to a plain object
                    const headers =
                        response.headers instanceof Headers
                            ? Object.fromEntries(response.headers.entries())
                            : response.headers || {};

                    res.writeHead(response.status || 200, headers);
                    res.end(await response.text());
                } else {
                    res.writeHead(404, { "Content-Type": "text/plain" });
                    res.end("Route not found");
                }
            } catch (error) {
                console.error(error);

                res.writeHead(500, { "Content-Type": "text/html" });
                res.end(
                    `<pre>${error.message}\n${
                        error.stack || "No stack trace available"
                    }</pre>`
                );
            }
        });

        server.listen(option.port, option.hostname, () => {
            console.log(
                `Server running at http://${option.hostname}:${option.port}`
            );
        });
    }
}
