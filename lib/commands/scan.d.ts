import { Command } from 'commander';
import { TScanApiOptions } from '../aikidoApi.js';
type TScanArguments = {
    repoId: string | number;
    baseCommitId: string;
    headCommitId: string;
    branchName: string;
    options: TScanApiOptions;
    pollInterval: number;
    onStart?: () => void | null;
    onStartComplete?: (startResult: any) => void | null;
    onStartFail?: (error: any) => void | null;
    onScanStart?: (startResult: any) => void | null;
    onScanComplete?: (startResult: any) => void | null;
    onScanFail?: (error: any) => void | null;
};
type TScanUserCliOptions = {
    pullRequestTitle?: string;
    pullRequestUrl?: string;
    selfManagedScanners?: string[];
    failOnDependencyScan?: boolean;
    failOnSastScan?: boolean;
    failOnIacScan?: boolean;
    minimumSeverityLevel?: string;
    pollInterval?: number;
};
declare function cli(repoId: string, baseCommitId: string, headCommitId: string, branchName: string, options: TScanUserCliOptions, command: string): Promise<void>;
export declare const scan: ({ repoId, baseCommitId, headCommitId, branchName, options, pollInterval, onStart, onStartComplete, onStartFail, onScanStart, onScanComplete, onScanFail, }: TScanArguments) => Promise<void>;
export declare const cliSetup: (program: Command) => Command;
declare const _default: {
    cli: typeof cli;
    cliSetup: (program: Command) => Command;
    scan: ({ repoId, baseCommitId, headCommitId, branchName, options, pollInterval, onStart, onStartComplete, onStartFail, onScanStart, onScanComplete, onScanFail, }: TScanArguments) => Promise<void>;
};
export default _default;
