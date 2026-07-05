// Test stub for the `server-only` marker package. In a real Next build it
// guards against importing server code into client bundles; under Vitest (Node)
// we alias it to this no-op so the modules can be unit-tested directly.
export {};
