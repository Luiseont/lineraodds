class VersionMismatchError extends Error {
    constructor(targetVersion, packageVersions){
        // Identify packages with mismatched versions
        const affectedPackages = Object.entries(packageVersions).filter(([, v])=>v !== targetVersion).map(([pkgName, installedVersion])=>`- \`${pkgName}\` (installed: **${installedVersion}**, required: **${targetVersion}**)`).join('\n');
        // Error message template
        const errorMessage = `
🚨 Version Mismatch Error

One or more \`@dynamic-labs-sdk\` packages are installed with mismatched versions. All \`@dynamic-labs-sdk\` packages must be on the same version to work correctly.

Affected Packages:
${affectedPackages}

💡 To fix this issue, update all @dynamic-labs-sdk/* packages to version \`${targetVersion}\` in your package.json
`;
        super(errorMessage.trim());
        this.name = 'VersionMismatchError';
    }
}

/**
 * A mapping of package names to their versions.
 */ let packageVersions = {};
/**
 * Timeout ID for batching version checks.
 */ let versionCheckTimeout = null;
/**
 * Asserts that all `@dynamic-labs-sdk` packages are on the same version.
 * Throws an error with instructions if versions mismatch.
 *
 * @param {string} packageName - The name of the package to assert.
 * @param {string} version - The version of the package.
 */ const assertPackageVersion = (packageName, version)=>{
    // Update the package version mapping
    packageVersions[packageName] = version;
    // Clear any existing timeout
    if (versionCheckTimeout) {
        clearTimeout(versionCheckTimeout);
        versionCheckTimeout = null;
    }
    /**
   * Timeout is set to 100ms to ensure the following:
   * - All package versions have been imported and registered.
   */ const timeout = 100;
    /**
   * Set a timeout to batch the version check.
   * This ensures that the check is executed after all package versions have been imported
   * and registered.
   */ versionCheckTimeout = setTimeout(()=>{
        const versions = Object.values(packageVersions);
        const [firstVersion] = versions;
        const allSameVersion = versions.every((v)=>v === firstVersion);
        if (!allSameVersion) {
            // Determine the required (target) version
            const targetVersion = packageVersions['@dynamic-labs-sdk/client'] || firstVersion;
            const error = new VersionMismatchError(targetVersion, packageVersions);
            // eslint-disable-next-line no-console
            console.error(error);
        }
        versionCheckTimeout = null;
    }, timeout);
};

export { assertPackageVersion };
