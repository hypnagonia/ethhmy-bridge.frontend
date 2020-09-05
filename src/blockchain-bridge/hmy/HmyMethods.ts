import { Harmony } from '@harmony-js/core';
import { Contract } from '@harmony-js/contract';
import { connectToOneWallet } from './helpers';

interface IHmyMethodsInitParams {
  hmy: Harmony;
  hmyTokenContract: Contract;
  hmyManagerContract: Contract;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethods {
  private hmy: Harmony;
  private hmyTokenContract: Contract;
  private hmyManagerContract: Contract;
  private options = { gasPrice: 1000000000, gasLimit: 6721900 };

  constructor(params: IHmyMethodsInitParams) {
    this.hmy = params.hmy;
    this.hmyTokenContract = params.hmyTokenContract;
    this.hmyManagerContract = params.hmyManagerContract;

    if (params.options) {
      this.options = params.options;
    }
  }

  approveHmyManger = (amount, sendTxCallback?) => {
    return new Promise(async (resolve, reject) => {
      try {
        await connectToOneWallet(this.hmyTokenContract.wallet, null, reject);

        const res = await this.hmyTokenContract.methods
          .approve(this.hmyManagerContract.address, amount)
          .send(this.options)
          .on('transactionHash', sendTxCallback);

        resolve(res);
      } catch (e) {
        reject(e);
      }
    });
  };

  burnToken = async (userAddr, amount, sendTxCallback?) => {
    return new Promise(async (resolve, reject) => {
      try {
        await connectToOneWallet(this.hmyManagerContract.wallet, null, reject);

        let response = await this.hmyManagerContract.methods
          .burnToken(amount, userAddr)
          .send(this.options)
          .on('transactionHash', sendTxCallback);

        resolve(response.transaction.id);
      } catch (e) {
        reject(e);
      }
    });
  };

  checkHmyBalance = async (addr: string) => {
    const addrHex = this.hmy.crypto.getAddress(addr).checksum;

    return await this.hmyTokenContract.methods
      .balanceOf(addrHex)
      .call(this.options);
  };

  /*approve = async (addrHex: string, amount: string) => {
    //const addrHex = this.hmy.crypto.getAddress(addr).checksum;

    return await this.hmyTokenContract.methods
        .approve(addrHex, amount).send(
            this.options
        )

  };
  */

  approve = async (addr, amount, sendTxCallback?) => {
    return new Promise(async (resolve, reject) => {
      try {
        await connectToOneWallet(this.hmyTokenContract.wallet, null, reject);

         const addrHex = this.hmy.crypto.getAddress(addr).checksum;
        //console.log({addrHex, amount, options: this.options})
        //console.log({addrHex})

        const res = await this.hmyTokenContract.methods
            .approve(addrHex, amount)
            .send(this.options)
            .on('transactionHash', sendTxCallback);

        console.log('approve done')
        resolve(res);
      } catch (e) {
        console.log('approve reject')
        reject(e);
      }
    });
  };
}
