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
    public async signOut() {
        console.log('signOut')
        //@ts-ignore
        await window.mathExtension
            .forgetIdentity()
        this.isAuthorized = false
    }

    @action.bound
    public async signIn() {
        try {
            this.error = '';

            // @ts-ignore
            const isMathWallet = !!window.mathExtension

            if (!isMathWallet) {
                setTimeout(this.signIn, 1000)
                return this.setError('Math Wallet not found');
            }

            // @ts-ignore
            const identity = await window.mathExtension
                .getIdentity({
                    blockchain: "binance",
                    chainId: "Binance-Chain-Ganges",
                })

            this.handleAccountsChanged([identity.account])
            /*.then((identity) => {
                this.address = identity.account;
                this.httpProvider = window.mathExtension.httpProvider(this.rpcUrl);
                this.getBalance();
            });*/

            this.isAuthorized = true;


            // this.handleAccountsChanged(window.web3.eth.accounts)
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

                // @ts-ignore
                const {result} = await window.mathExtension.httpProvider('https://testnet-dex-asiapacific.binance.org').get(`/api/v1/account/${this.ethAddress}`)
                const {balances} = result
                this.ethBalance = balances.find(a => a.symbol === 'BNB').free
                this.ethBUSDBalance = balances.find(a => a.symbol === 'HRC20-1DC').free

               /* this.ethBalance = await new Promise((resolve, reject) => {
                    // @ts-ignore
                    window.web3.eth.getBalance(this.ethAddress, (err, balance) => {
                        if (err) {
                            return reject(err)
                        }

                        resolve(balance)
                    })

                });*/

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
