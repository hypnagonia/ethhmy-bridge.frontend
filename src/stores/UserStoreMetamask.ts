import {action, observable} from 'mobx';
import {statusFetching} from '../constants';
import detectEthereumProvider from '@metamask/detect-provider';
import {StoreConstructor} from './core/StoreConstructor';
import {
    getEthBalance,
    ethMethodsBUSD,
    ethMethodsLINK,
} from '../blockchain-bridge';

const defaults = {};

export class UserStoreMetamask extends StoreConstructor {
    @observable public isAuthorized: boolean;
    @observable error: string = '';

    public status: statusFetching;

    @observable public isMetaMask = false;
    private provider: any;

    @observable public ethAddress: string;
    @observable public ethBalance: string = '0';
    @observable public ethBUSDBalance: string = '0';
    @observable public ethLINKBalance: string = '0';

    constructor(stores) {
        super(stores);

        setInterval(() => this.getBalances(), 3 * 1000);

        this.signIn();
    }

    @action.bound
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            return this.setError('Please connect to MetaMask');
        } else {
            this.ethAddress = accounts[0];
        }
    }

    @action.bound
    setError(error: string) {
        this.error = error;
        this.isAuthorized = false;
    }

    @action.bound
    public async signIn() {
        try {
            this.error = '';

            // @ts-ignore
            const isMathWallet = window.web3
                // @ts-ignore
                && window.web3.currentProvider
                // @ts-ignore
                && window.web3.currentProvider.isMathWallet
                // @ts-ignore
                && window.web3.currentProvider.chainId === '97'
                // @ts-ignore
                && window.web3.currentProvider.rpc.rpcUrl.indexOf('binance') !== -1

            if (!isMathWallet) {
                setTimeout(this.signIn, 1000)
                return this.setError('Math Wallet not found');
            }

            this.isAuthorized = true;

            this.handleAccountsChanged(window.web3.eth.accounts)
            /* const provider = await detectEthereumProvider();

             this.provider = provider;


             this.provider.on('accountsChanged', this.handleAccountsChanged);

             this.provider.on('disconnect', () => {
                 this.isAuthorized = false;
                 this.ethAddress = null;
             });

             this.provider
                 .request({method: 'eth_requestAccounts'})
                 .then(this.handleAccountsChanged)
                 .catch(err => {
                     if (err.code === 4001) {
                         return this.setError('Please connect to MetaMask.');
                     } else {
                         console.error(err);
                     }
                 });*/
        } catch (e) {
            return this.setError(e.message);
        }
    }

    @action.bound public getBalances = async () => {
        if (this.ethAddress) {
            try {
                this.ethBalance = await new Promise((resolve, reject) => {
                    // @ts-ignore
                    window.web3.eth.getBalance(this.ethAddress, (err, balance)=>{
                        if (err) {
                            return reject(err)
                        }

                        resolve(balance)
                    })

                });

            } catch (e) {
                console.error(e);
            }
        }
    };

    @action
    public reset() {
        Object.assign(this, defaults);
    }
}
