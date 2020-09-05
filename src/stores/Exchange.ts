import {StoreConstructor} from './core/StoreConstructor';
import {action, computed, observable} from 'mobx';
import {statusFetching} from '../constants';
import {IOperation, EXCHANGE_MODE, STATUS, TOKEN} from './interfaces';
import * as operationService from 'services';

import {
    formatWithSixDecimals,
    formatBNBDecimals,
    formatWithTwoDecimals,
    ones,
    truncateAddressString,
} from 'utils';

import BN from "bn.js";
import {parseAmount, formatAmount} from "../utils/binance";
import Web3 from "web3";

import {
    hmyMethodsBUSD,
    binanceBridgeContract
} from '../blockchain-bridge';
import {connectToOneWallet} from "../blockchain-bridge/hmy/helpers";

export enum EXCHANGE_STEPS {
    BASE = 'BASE',
    CONFIRMATION = 'CONFIRMATION',
    SENDING = 'SENDING',
    RESULT = 'RESULT',
}

export interface IStepConfig {
    id: EXCHANGE_STEPS;
    buttons: Array<{
        title: string;
        onClick: () => void;
        validate?: boolean;
        transparent?: boolean;
    }>;
    title?: string;
}

export class Exchange extends StoreConstructor {
    @observable error = '';
    @observable txHash = '';
    @observable actionStatus: statusFetching = 'init';
    @observable stepNumber = 0;

    defaultTransaction = {
        oneAddress: '',
        ethAddress: '',
        amount: '0',
    };

    @observable transaction = this.defaultTransaction;
    @observable mode: EXCHANGE_MODE = EXCHANGE_MODE.ETH_TO_ONE;
    @observable token: TOKEN;

    constructor(stores) {
        super(stores);

        /* setInterval(async () => {
           if (this.operation) {
             this.operation = await operationService.getOperation(this.operation.id);
             this.setStatus();
           }
         }, 3000);*/
    }

    @computed
    get step() {
        return this.stepsConfig[this.stepNumber];
    }

    stepsConfig: Array<IStepConfig> = [
        {
            id: EXCHANGE_STEPS.BASE,
            buttons: [
                {
                    title: 'Continue',
                    onClick: () => {

                        console.log('stepsConfig', this.stores.userMetamask.ethAddress, this.stores.user.address)
                        this.stepNumber = this.stepNumber + 1;
                        // this.transaction.oneAddress = this.stores.user.address;
                        switch (this.mode) {
                            case EXCHANGE_MODE.ETH_TO_ONE:
                                this.transaction.ethAddress = this.stores.userMetamask.ethAddress;
                            case EXCHANGE_MODE.ONE_TO_ETH:
                                this.transaction.oneAddress = this.stores.user.address;
                        }

                        console.log('stepsConfig',
                            this.stores.userMetamask.ethAddress,
                            this.stores.user.address,
                            this.transaction.oneAddress,
                            this.transaction.ethAddress
                        )
                    },
                    validate: true,
                },
            ],
        },
        {
            id: EXCHANGE_STEPS.CONFIRMATION,
            buttons: [
                {
                    title: 'Back',
                    onClick: () => (this.stepNumber = this.stepNumber - 1),
                    transparent: true,
                },
                {
                    title: 'Confirm',
                    onClick: () => {
                        this.stepNumber = this.stepNumber + 1;
                        this.sendOperation();
                    },
                },
            ],
        },
        {
            id: EXCHANGE_STEPS.SENDING,
            buttons: [],
        },
        {
            id: EXCHANGE_STEPS.RESULT,
            buttons: [
                {
                    title: 'Close',
                    transparent: true,
                    onClick: () => {
                        this.clear();
                        this.stepNumber = 0;
                    },
                },
            ],
        },
    ];

    @action.bound
    setAddressByMode() {
        if (this.mode === EXCHANGE_MODE.ETH_TO_ONE) {
            this.transaction.oneAddress = this.stores.user.address;
            this.transaction.ethAddress = this.stores.userMetamask.ethAddress;
        }

        if (this.mode === EXCHANGE_MODE.ONE_TO_ETH) {
            this.transaction.ethAddress = this.stores.userMetamask.ethAddress;
            this.transaction.oneAddress = this.stores.user.address;
        }
    }

    @action.bound
    setMode(mode: EXCHANGE_MODE) {
        this.clear();
        this.mode = mode;
        this.setAddressByMode();
    }

    @action.bound
    setToken(token: TOKEN) {
        // this.clear();
        this.token = token;
        this.setAddressByMode();
    }

    @observable operation: IOperation;

    @action.bound
    setStatus() {
        switch (this.operation.status) {
            case STATUS.ERROR:
                this.actionStatus = 'error';
                this.stepNumber = this.stepsConfig.length - 1;
                break;

            case STATUS.SUCCESS:
                this.actionStatus = 'success';
                this.stepNumber = this.stepsConfig.length - 1;
                break;

            case STATUS.WAITING:
            case STATUS.IN_PROGRESS:
                this.stepNumber = 2;
                this.actionStatus = 'fetching';
                break;
        }
    }


    @action.bound
    async createOperation() {

        console.log('createOperation', {
            transaction: this.transaction,
            mode: this.mode,
            token: this.token
        })

        /*  this.operation = await operationService.createOperation({
            ...this.transaction,
            type: this.mode,
            token: this.token,
            fee: '0.00021',
          });*/

        // return this.operation.id;
    }

    @action.bound
    async sendOperation(id: string = '') {
        console.log('sendOperation')
        try {
            this.actionStatus = 'fetching';

            console.log('sendOperation',
                this.transaction.oneAddress,
                this.transaction.ethAddress,
                this.transaction.amount,
            )

            /*if (!operationId) {
              operationId = await this.createOperation();

              this.stores.routing.push(
                this.token + '/operations/' + this.operation.id,
              );
            }

            await this.setOperationId(operationId);*/

            const binanceBNBBalance = this.stores.userMetamask.ethBalance
            const binanceHRC20Balance = this.stores.userMetamask.ethBUSDBalance

            const harmonyONEBalance = this.stores.user.balance
            const harmonyBNBBalance = this.stores.user.hmyBUSDBalance

            let {amount, oneAddress, ethAddress} = this.transaction

            if (this.mode === 'eth_to_one') {
                // console.log({})
                amount = String(+amount * 10 ** 8)

                // @ts-ignore
                const httpProvider = window.mathExtension.httpProvider('https://testnet-dex-asiapacific.binance.org')
                const account = await httpProvider.get(
                    `/api/v1/account/${ethAddress}`
                );

                const node = await httpProvider.get(`/api/v1/node-info`);

                const sequence = account.result && account.result.sequence;
                const accountNumber = account.result && account.result.account_number;
                const chainId = node.result.node_info.network;

                const from = ethAddress
                const to = 'tbnb1qwsdcq4pvnwqr8x43ww4whq0klvgf0dvlvwuqv'

                console.log({from, to, amount, accountNumber, chainId})

                const transaction = {
                    chain_id: chainId,
                    account_number: accountNumber,
                    sequence: sequence,
                    memo: oneAddress,
                    type: "SendMsg",
                    sender: from,
                    msg: {
                        inputs: [{
                            address: from,
                            coins: [{
                                denom: "HRC20-1DC",
                                amount
                            }]
                        }],
                        outputs: [{
                            address: to,
                            coins: [{
                                denom: "HRC20-1DC",
                                amount
                            }]
                        }]
                    }
                }

                console.log({transaction})

                // @ts-ignore
                const signTransaction = await window.mathExtension.requestSignature(
                    transaction,
                    {
                        blockchain: "binance",
                        chainId
                    }
                );

                console.log({signTransaction})

                const opts = {
                    data: signTransaction.tx,
                    headers: {
                        "Content-Type": "text/plain",
                    },
                };
                const result = await httpProvider.post(
                    "/api/v1/broadcast?sync=true",
                    null,
                    opts
                );

                console.log(signTransaction, result);

                console.log({account})


                this.actionStatus = 'success';
                this.stepNumber = this.stepsConfig.length - 1;

                return
            } else {
                const bridgeAddress = '0xd61c7401944413a44b7db275c9c094aef13486ad'

                //0xd61C7401944413a44b7Db275c9c094AeF13486aD
                //0xd61c7401944413a44b7db275c9c094aef13486ad
                //hmyMethodsBUSD
                /*
                here is the bridge address 0xd61c7401944413a44b7db275c9c094aef13486ad and Bridge.json attached. you need make these two calls

                let response =
                await token.methods.approve(HOME_BRIDGE_ADDRESS, amount).send(options);

                response = await bridge.methods.exchange(amount).send(options);
                 */

                console.log('approve start')
                const result = await hmyMethodsBUSD.approve(
                    bridgeAddress,
                    amount
                );
                console.log('approve end')

                console.log('result',{result})

                const options = { gasPrice: 1000000000, gasLimit: 6721900 }

                await connectToOneWallet(binanceBridgeContract.wallet, null, (e)=>{
                    throw e
                });
                const res2 = await binanceBridgeContract
                    .methods.exchange(amount).send(options)
                console.log({res2})


                this.actionStatus = 'success';
                this.stepNumber = this.stepsConfig.length - 1;

                return
            }


            /*  if (
                  this.operation.status === STATUS.SUCCESS ||
                  this.operation.status === STATUS.ERROR
              ) {
                  return;
              }

              const confirmCallback = async (transactionHash, actionId) => {
                  this.operation = await operationService.confirmAction({
                      operationId,
                      transactionHash,
                      actionId,
                  });
              };

              let ethMethods, hmyMethods;

              if (this.token === TOKEN.BUSD) {
                  ethMethods = ethMethodsBUSD;
                  hmyMethods = hmyMethodsBUSD;
              }

              if (this.token === TOKEN.LINK) {
                  ethMethods = ethMethodsLINK;
                  hmyMethods = hmyMethodsLINK;
              }

              if (this.mode === EXCHANGE_MODE.ETH_TO_ONE) {
                  const approveEthManger = this.operation.actions[0];

                  if (approveEthManger.status === STATUS.WAITING) {
                      await ethMethods.approveEthManger(this.transaction.amount, hash =>
                          confirmCallback(hash, approveEthManger.id),
                      );
                  }

                  const lockToken = this.operation.actions[1];

                  if (lockToken.status === STATUS.WAITING) {
                      await ethMethods.lockToken(
                          this.transaction.oneAddress,
                          this.transaction.amount,
                          hash => confirmCallback(hash, lockToken.id),
                      );
                  }
              }

              if (this.mode === EXCHANGE_MODE.ONE_TO_ETH) {
                  const approveHmyManger = this.operation.actions[0];

                  if (approveHmyManger.status === STATUS.WAITING) {
                      await hmyMethods.approveHmyManger(this.transaction.amount, hash =>
                          confirmCallback(hash, approveHmyManger.id),
                      );
                  }

                  const burnToken = this.operation.actions[1];

                  if (burnToken.status === STATUS.WAITING) {
                      await hmyMethods.burnToken(
                          this.transaction.ethAddress,
                          this.transaction.amount,
                          hash => confirmCallback(hash, burnToken.id),
                      );
                  }
              }*/

            return;
        } catch (e) {
            console.log({e})
            if (e.status && e.response.body) {
                this.error = e.response.body.message;
            } else {
                this.error = e.message;
            }
            this.actionStatus = 'error';
            this.operation = null;
        }

        this.stepNumber = this.stepsConfig.length - 1;
    }

    clear() {
        this.transaction = this.defaultTransaction;
        this.operation = null;
        this.error = '';
        this.txHash = '';
        this.actionStatus = 'init';
        this.stepNumber = 0;
        this.stores.routing.push(`/${this.token}`);
    }
}
