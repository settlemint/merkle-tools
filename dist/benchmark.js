'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const benchmark_1 = __importDefault(require("benchmark"));
const crypto_1 = __importDefault(require("crypto"));
const merkletools_1 = __importDefault(require("./merkletools"));
const suite = new benchmark_1.default.Suite();
const merkleTools = new merkletools_1.default();
const leafCount = 75000;
const leaves = [];
// generate random hashes to use as leaves
for (let x = 0; x < leafCount; x++) {
    leaves.push(crypto_1.default.randomBytes(32).toString('hex'));
}
// add test to populate leaves, build tree, generate proofs, and reset tree
suite
    .add(leafCount + 'leaves', function () {
    merkleTools.addLeaves(leaves); // add random leaves to tree
    merkleTools.makeTree(); // build the merkle tree
    for (let x = 0; x < leafCount; x++) {
        // generate the merkle proofs for each leaf
        merkleTools.getProof(x);
    }
    merkleTools.resetTree(); // clear the tree
})
    .on('cycle', function (event) {
    console.log(String(event.target));
})
    .on('complete', function () {
    console.log(this[0].stats);
})
    .run({ async: true });
//# sourceMappingURL=benchmark.js.map