import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const production = process.argv.includes("--production") || process.env["IS_DEBUG_BUILD"] === "false";
const watch = process.argv.includes("--watch");
const destDir = "out";

/**
 * @type {import('esbuild').Plugin}
 */
const aliasResolverPlugin = {
	name: "alias-resolver",
	setup(build) {
		const aliases = {
			"@": path.resolve(__dirname, "src"),
			"@core": path.resolve(__dirname, "src/core"),
			"@integrations": path.resolve(__dirname, "src/integrations"),
			"@services": path.resolve(__dirname, "src/services"),
			"@shared": path.resolve(__dirname, "src/shared"),
			"@utils": path.resolve(__dirname, "src/utils"),
			"@packages": path.resolve(__dirname, "src/packages"),
		};

		// For each alias entry, create a resolver
		Object.entries(aliases).forEach(([alias, aliasPath]) => {
			const aliasRegex = new RegExp(`^${alias}($|/.*)`);
			build.onResolve({ filter: aliasRegex }, (args) => {
				const importPath = args.path.replace(alias, aliasPath);

				// First, check if the path exists as is
				if (fs.existsSync(importPath)) {
					const stats = fs.statSync(importPath);
					if (stats.isDirectory()) {
						// If it's a directory, try to find index files
						const extensions = [".ts", ".tsx", ".js", ".jsx"];
						for (const ext of extensions) {
							const indexFile = path.join(importPath, `index${ext}`);
							if (fs.existsSync(indexFile)) {
								return { path: indexFile };
							}
						}
					} else {
						// It's a file that exists, so return it
						return { path: importPath };
					}
				}

				// If the path doesn't exist, try appending extensions
				const extensions = [".ts", ".tsx", ".js", ".jsx"];
				for (const ext of extensions) {
					const pathWithExtension = `${importPath}${ext}`;
					if (fs.existsSync(pathWithExtension)) {
						return { path: pathWithExtension };
					}
				}

				// If nothing worked, return the original path and let esbuild handle the error
				return { path: importPath };
			});
		});
	},
};

const esbuildProblemMatcherPlugin = {
	name: "esbuild-problem-matcher",

	setup(build) {
		build.onStart(() => {
			console.log("[watch] build started");
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log("[watch] build finished");
		});
	},
};

const buildEnvVars = {
	"import.meta.url": "_importMetaUrl",
};

if (production) {
	// IS_DEV is always disable in production builds.
	buildEnvVars["process.env.IS_DEV"] = "false";
}

// Base configuration shared between extension and standalone builds
const baseConfig = {
	bundle: true,
	minify: production,
	sourcemap: !production,
	logLevel: "silent",
	define: buildEnvVars,
	tsconfig: path.resolve(__dirname, "tsconfig.json"),
	plugins: [
		// copyWasmFiles,
		aliasResolverPlugin,
		/* add to the end of plugins array */
		esbuildProblemMatcherPlugin,
	],
	format: "cjs",
	sourcesContent: false,
	platform: "node"
};

// Extension-specific configuration
const extensionConfig = {
	...baseConfig,
	entryPoints: ["src/extension.ts"],
	outfile: `${destDir}/extension.js`,
	external: ["vscode"],
};

async function main() {
	const config = extensionConfig;
	const extensionCtx = await esbuild.context(config);
	if (watch) {
		await extensionCtx.watch();
	} else {
		await extensionCtx.rebuild();
		await extensionCtx.dispose();
	}
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
