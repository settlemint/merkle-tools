/// <reference types="node" />
export interface ITreeOptions {
    hashType: string;
}
export interface ISibling {
    left?: string;
    right?: string;
}
export default class MerkleTools {
    private hashType;
    private tree;
    constructor(treeOptions?: ITreeOptions);
    /**
     * Resets the current tree to empty
     */
    resetTree(): void;
    /**
     * Add a leaf to the tree.
     * Accepts hash value as a Buffer or hex string
     *
     * @param {(string | Buffer)} value the value to be added to the tree
     * @param {boolean} [doHash=false] should the value be hashed first?
     * @memberof MerkleTools
     */
    addLeaf(value: string | Buffer, doHash?: boolean): void;
    /**
     * Add a leaves to the tree
     * Accepts hash values as an array of Buffers or hex strings
     *
     * @param {(Array<string | Buffer>)} valuesArray and array with values
     * @param {boolean} [doHash=false] should the values be hashed first?
     * @memberof MerkleTools
     */
    addLeaves(valuesArray: Array<string | Buffer>, doHash?: boolean): void;
    /**
     * Returns a leaf at the given index
     *
     * @param {number} index the index of the leaf
     * @returns {Buffer} the leaf
     * @memberof MerkleTools
     */
    getLeaf(index: number): Buffer;
    /**
     * Returns the number of leaves added to the tree
     *
     * @returns {number} the number of leaves added to the tree
     * @memberof MerkleTools
     */
    getLeafCount(): number;
    /**
     * Returns the ready state of the tree
     *
     * @returns {boolean} is the tree ready?
     * @memberof MerkleTools
     */
    getTreeReadyState(): boolean;
    /**
     * Generates the merkle tree
     *
     * @param {boolean} [doubleHash=false]
     * @memberof MerkleTools
     */
    makeTree(doubleHash?: boolean): void;
    /**
     * Generates a Bitcoin style merkle tree
     *
     * @param {boolean} [doubleHash=false]
     * @memberof MerkleTools
     */
    makeBTCTree(doubleHash?: boolean): void;
    /**
     * Returns the merkle root value for the tree
     *
     * @returns {Buffer}
     * @memberof MerkleTools
     */
    getMerkleRoot(): Buffer;
    /**
     * Returns the proof for a leaf at the given index as an array of merkle siblings in hex format
     *
     * @param {number} index
     * @returns {(Array<Buffer|ISibling>)}
     * @memberof MerkleTools
     */
    getProof(index: number): ISibling[];
    /**
     * Takes a proof array, a target hash value, and a merkle root
     * Checks the validity of the proof and return true or false
     *
     * @param {Array<ISibling>} proof
     * @param {(Buffer | string)} targetHash
     * @param {(Buffer | string)} merkleRoot
     * @param {boolean} [doubleHash=false]
     * @returns {boolean}
     * @memberof MerkleTools
     */
    validateProof(proof: ISibling[], targetHash: Buffer | string, merkleRoot: Buffer | string, doubleHash?: boolean): boolean;
    /**
     * Hashes the value using the provided algorithm
     *
     * @private
     * @param {(string | Buffer)} value the value to be hashed
     * @returns {Buffer} the hashed value as a buffer
     * @memberof MerkleTools
     */
    private hashFunction(value);
    /**
     * Internally, trees are made of nodes containing Buffer values only. This helps ensure that leaves
     * being added are Buffers, and will convert hex to Buffer if needed
     *
     * @private
     * @param {(string | Buffer)} value
     * @returns {Buffer}
     * @memberof MerkleTools
     */
    private getBuffer(value);
    /**
     * Checks if the value is a hex
     *
     * @private
     * @param {string} value the value to check
     * @returns {boolean} if the value is a hex
     * @memberof MerkleTools
     */
    private isHex(value);
    /**
     * Calculates the next level of node when building the merkle tree
     * These values are calcalated off of the current highest level, level 0 and will be prepended to the levels array
     *
     * @private
     * @param {boolean} [doubleHash=false]
     * @returns {Buffer[]}
     * @memberof MerkleTools
     */
    private calculateNextLevel(doubleHash?);
    /**
     * This version uses the BTC method of duplicating the odd ending nodes
     *
     * @private
     * @param {boolean} [doubleHash=false]
     * @returns {Buffer[]}
     * @memberof MerkleTools
     */
    private calculateBTCNextLevel(doubleHash?);
}
