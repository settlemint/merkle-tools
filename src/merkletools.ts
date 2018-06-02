/* Copyright 2017 Tierion / Modified by SettleMint in 2018
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*     http://www.apache.org/licenses/LICENSE-2.0
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import crypto from 'crypto';
import { Message, sha3_224, sha3_256, sha3_384, sha3_512 } from 'js-sha3';
import { isString } from 'util';

export interface ITreeOptions {
  hashType: string;
}

interface ITree {
  leaves: Buffer[];
  levels: Buffer[][];
  isReady: boolean;
}

export interface ISibling {
  left?: string;
  right?: string;
}

export default class MerkleTools {
  private hashType: string;
  private tree: ITree = {
    isReady: false,
    leaves: [],
    levels: []
  };

  constructor(treeOptions: ITreeOptions = { hashType: 'sha256' }) {
    this.hashType = treeOptions.hashType;
  }

  /**
   * Resets the current tree to empty
   */
  public resetTree() {
    this.tree = {
      isReady: false,
      leaves: [],
      levels: []
    };
  }

  /**
   * Add a leaf to the tree.
   * Accepts hash value as a Buffer or hex string
   *
   * @param {(string | Buffer)} value the value to be added to the tree
   * @param {boolean} [doHash=false] should the value be hashed first?
   * @memberof MerkleTools
   */
  public addLeaf(value: string | Buffer, doHash: boolean = false) {
    this.tree.isReady = false;
    if (doHash) {
      value = this.hashFunction(value);
    }
    this.tree.leaves.push(this.getBuffer(value));
  }

  /**
   * Add a leaves to the tree
   * Accepts hash values as an array of Buffers or hex strings
   *
   * @param {(Array<string | Buffer>)} valuesArray and array with values
   * @param {boolean} [doHash=false] should the values be hashed first?
   * @memberof MerkleTools
   */
  public addLeaves(
    valuesArray: Array<string | Buffer>,
    doHash: boolean = false
  ) {
    valuesArray.forEach(value => {
      this.addLeaf(value, doHash);
    });
  }

  /**
   * Returns a leaf at the given index
   *
   * @param {number} index the index of the leaf
   * @returns {Buffer} the leaf
   * @memberof MerkleTools
   */
  public getLeaf(index: number): Buffer {
    if (index < 0 || index > this.tree.leaves.length - 1) {
      return null; // index is out of array bounds
    }
    return this.tree.leaves[index];
  }

  /**
   * Returns the number of leaves added to the tree
   *
   * @returns {number} the number of leaves added to the tree
   * @memberof MerkleTools
   */
  public getLeafCount(): number {
    return this.tree.leaves.length;
  }

  /**
   * Returns the ready state of the tree
   *
   * @returns {boolean} is the tree ready?
   * @memberof MerkleTools
   */
  public getTreeReadyState(): boolean {
    return this.tree.isReady;
  }

  /**
   * Generates the merkle tree
   *
   * @param {boolean} [doubleHash=false]
   * @memberof MerkleTools
   */
  public makeTree(doubleHash: boolean = false) {
    this.tree.isReady = false;
    const leafCount = this.tree.leaves.length;
    if (leafCount > 0) {
      // skip this whole process if there are no leaves added to the tree
      this.tree.levels = [];
      this.tree.levels.unshift(this.tree.leaves);
      while (this.tree.levels[0].length > 1) {
        this.tree.levels.unshift(this.calculateNextLevel(doubleHash));
      }
    }
    this.tree.isReady = true;
  }

  /**
   * Generates a Bitcoin style merkle tree
   *
   * @param {boolean} [doubleHash=false]
   * @memberof MerkleTools
   */
  public makeBTCTree(doubleHash: boolean = false) {
    this.tree.isReady = false;
    const leafCount = this.tree.leaves.length;
    if (leafCount > 0) {
      // skip this whole process if there are no leaves added to the tree
      this.tree.levels = [];
      this.tree.levels.unshift(this.tree.leaves);
      while (this.tree.levels[0].length > 1) {
        this.tree.levels.unshift(this.calculateBTCNextLevel(doubleHash));
      }
    }
    this.tree.isReady = true;
  }

  /**
   * Returns the merkle root value for the tree
   *
   * @returns {Buffer}
   * @memberof MerkleTools
   */
  public getMerkleRoot(): Buffer {
    if (!this.tree.isReady || this.tree.levels.length === 0) {
      return null;
    }
    return this.tree.levels[0][0];
  }

  /**
   * Returns the proof for a leaf at the given index as an array of merkle siblings in hex format
   *
   * @param {number} index
   * @returns {(Array<Buffer|ISibling>)}
   * @memberof MerkleTools
   */
  public getProof(index: number): ISibling[] {
    if (!this.tree.isReady) {
      return null;
    }
    const currentRowIndex = this.tree.levels.length - 1;
    if (index < 0 || index > this.tree.levels[currentRowIndex].length - 1) {
      return null;
    } // the index it out of the bounds of the leaf array

    const proof: ISibling[] = [];
    for (let x = currentRowIndex; x > 0; x--) {
      const currentLevelNodeCount = this.tree.levels[x].length;
      // skip if this is an odd end node
      if (
        index === currentLevelNodeCount - 1 &&
        currentLevelNodeCount % 2 === 1
      ) {
        index = Math.floor(index / 2);
        continue;
      }

      // determine the sibling for the current index and get its value
      const isRightNode = index % 2;
      const siblingIndex = isRightNode ? index - 1 : index + 1;

      const sibling: ISibling = {};
      const siblingPosition = isRightNode ? 'left' : 'right';
      const siblingValue = this.tree.levels[x][siblingIndex].toString('hex');
      sibling[siblingPosition] = siblingValue;
      proof.push(sibling);

      index = Math.floor(index / 2); // set index to the parent index
    }

    return proof;
  }

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
  public validateProof(
    proof: ISibling[],
    targetHash: Buffer | string,
    merkleRoot: Buffer | string,
    doubleHash: boolean = false
  ): boolean {
    targetHash = this.getBuffer(targetHash);
    merkleRoot = this.getBuffer(merkleRoot);
    if (proof.length === 0) {
      return targetHash.toString('hex') === merkleRoot.toString('hex'); // no siblings, single item tree, so the hash should also be the root
    }
    let proofHash = targetHash;
    for (const leaf of proof) {
      if (leaf.left) {
        // then the sibling is a left node
        if (doubleHash) {
          proofHash = this.hashFunction(
            this.hashFunction(
              Buffer.concat([this.getBuffer(leaf.left), proofHash])
            )
          );
        } else {
          proofHash = this.hashFunction(
            Buffer.concat([this.getBuffer(leaf.left), proofHash])
          );
        }
      } else if (leaf.right) {
        // then the sibling is a right node
        if (doubleHash) {
          proofHash = this.hashFunction(
            this.hashFunction(
              Buffer.concat([proofHash, this.getBuffer(leaf.right)])
            )
          );
        } else {
          proofHash = this.hashFunction(
            Buffer.concat([proofHash, this.getBuffer(leaf.right)])
          );
        }
      } else {
        // no left or right designation exists, proof is invalid
        return false;
      }
    }

    return proofHash.toString('hex') === merkleRoot.toString('hex');
  }

  /**
   * Hashes the value using the provided algorithm
   *
   * @private
   * @param {(string | Buffer)} value the value to be hashed
   * @returns {Buffer} the hashed value as a buffer
   * @memberof MerkleTools
   */
  private hashFunction(value: string | Buffer): Buffer {
    switch (this.hashType) {
      case 'SHA3-224':
        return Buffer.from(sha3_224.update(value).array());
      case 'SHA3-256':
        return Buffer.from(sha3_256.update(value).array());
      case 'SHA3-384':
        return Buffer.from(sha3_384.update(value).array());
      case 'SHA3-512':
        return Buffer.from(sha3_512.update(value).array());
      default:
        return crypto
          .createHash(this.hashType)
          .update(value)
          .digest();
    }
  }

  /**
   * Internally, trees are made of nodes containing Buffer values only. This helps ensure that leaves
   * being added are Buffers, and will convert hex to Buffer if needed
   *
   * @private
   * @param {(string | Buffer)} value
   * @returns {Buffer}
   * @memberof MerkleTools
   */
  private getBuffer(value: string | Buffer): Buffer {
    if (value instanceof Buffer) {
      // we already have a buffer, so return it
      return value;
    } else if (this.isHex(value)) {
      // the value is a hex string, convert to buffer and return
      return Buffer.from(value, 'hex');
    } else {
      // the value is neither buffer nor hex string, will not process this, throw error
      throw new Error("Bad hex value - '" + value + "'");
    }
  }

  /**
   * Checks if the value is a hex
   *
   * @private
   * @param {string} value the value to check
   * @returns {boolean} if the value is a hex
   * @memberof MerkleTools
   */
  private isHex(value: string): boolean {
    const hexRegex = /^[0-9A-Fa-f]{2,}$/;
    return hexRegex.test(value);
  }

  /**
   * Calculates the next level of node when building the merkle tree
   * These values are calcalated off of the current highest level, level 0 and will be prepended to the levels array
   *
   * @private
   * @param {boolean} [doubleHash=false]
   * @returns {Buffer[]}
   * @memberof MerkleTools
   */
  private calculateNextLevel(doubleHash: boolean = false): Buffer[] {
    const nodes = [];
    const topLevel = this.tree.levels[0];
    const topLevelCount = topLevel.length;
    for (let x = 0; x < topLevelCount; x += 2) {
      if (x + 1 <= topLevelCount - 1) {
        // concatenate and hash the pair, add to the next level array, doubleHash if requested
        if (doubleHash) {
          nodes.push(
            this.hashFunction(
              this.hashFunction(Buffer.concat([topLevel[x], topLevel[x + 1]]))
            )
          );
        } else {
          nodes.push(
            this.hashFunction(Buffer.concat([topLevel[x], topLevel[x + 1]]))
          );
        }
      } else {
        // this is an odd ending node, promote up to the next level by itself
        nodes.push(topLevel[x]);
      }
    }
    return nodes;
  }

  /**
   * This version uses the BTC method of duplicating the odd ending nodes
   *
   * @private
   * @param {boolean} [doubleHash=false]
   * @returns {Buffer[]}
   * @memberof MerkleTools
   */
  private calculateBTCNextLevel(doubleHash: boolean = false): Buffer[] {
    const nodes = [];
    const topLevel = this.tree.levels[0];
    const topLevelCount = topLevel.length;
    if (topLevelCount % 2 === 1) {
      // there is an odd count, duplicate the last element
      topLevel.push(topLevel[topLevelCount - 1]);
    }
    for (let x = 0; x < topLevelCount; x += 2) {
      // concatenate and hash the pair, add to the next level array, doubleHash if requested
      if (doubleHash) {
        nodes.push(
          this.hashFunction(
            this.hashFunction(Buffer.concat([topLevel[x], topLevel[x + 1]]))
          )
        );
      } else {
        nodes.push(
          this.hashFunction(Buffer.concat([topLevel[x], topLevel[x + 1]]))
        );
      }
    }
    return nodes;
  }
}
