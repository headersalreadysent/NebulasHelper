"use strict";

var Nebulas = require("nebulas");


var NasHelper = function (apiNet) {

	this.api = null

	this.timeout = 1000;
	this.debug = true;

	/**
	 * 
	 * sets debug status
	 * @param {boolean} debug 
	 */
	this.setDebug = function (debug) {
		this.debug = debug || true;
		return this;
	}

	/**
	 * sends a console.log
	 * @param {string} text message
	 * @param {string} type type of message
	 */
	this.log = function (text, type) {
		if (this.debug) {
			console.log((type != undefined ? "[" + type + "] " : '') + text);
		}
	}

	/**
	 * unlocks account
	 * @param {string|object} json 
	 * @param {string} pass 
	 */
	this.unlock = function (json, pass) {
		var account = new Nebulas.Account();
		json = typeof (json) == "string" ? JSON.parse(json) : json;
		account = account.fromKey(json, pass, true);
		return account;
	}

	/**
	 * get state of addr 
	 * @param {string} addr 
	 */
	this.getState = function (addr) {
		var self = this;
		return Promise.retry((resolve, reject) => {
			self.neb.api.getAccountState(addr)
				.then((accstate) => {
					accstate.nonce=parseInt(accstate.nonce);
					resolve(accstate)
				})
				.catch((err) => {
					console.log(err);
					self.log(addr + " get state error", 'error');
					setTimeout(() => {
						reject(err)
					}, self.timeout);
				})
		})
	}

	/**
	 * get state of transaction and resolves when it is ok
	 * @param {string} tx 
	 */
	this.txStatus = function (tx) {

		var self = this;
		return Promise.retry((resolve, reject) => {
			self.neb.api.getTransactionReceipt({
				hash: tx
			}).then((receipt) => {
				if (receipt.status != 2) {
					resolve(receipt)
				} else {
					self.log(tx + " transaction not finished, waiting", 'info');
					setTimeout(() => {
						reject(null)
					}, self.timeout);
				}
			}).catch((err) => {
				self.log(addr + " transaction check gets error, refreshing", 'error');
				setTimeout(() => {
					reject(err)
				}, self.timeout);
			})
		})
	}



	/**
	 * generate new address and resolves when it finish
	 * @param {*} pass 
	 */
	this.createAddress = function (pass) {
		return new Promise((resolve) => {
			var account = Nebulas.Account.NewAccount();

			pass = pass || Math.random().toString(16).substr(3, 10);

			var json = account.toKey(pass);
			var wallet = {
				address: account.getAddressString(),
				json: JSON.stringify(json),
				pass: pass,
			};
			resolve(wallet)
		})


	}

	/**
	 * sends tx to net and resolves when it is success
	 * @param {Nebulas.Transaction} tx 
	 * @param {number} times repeat time if not undefined tries to send as times time
	 * @param {number} timer delay time for transaction try
	 */
	this.sendTx = function (tx, times, timer) {

		var self = this;
		return Promise.retry((resolve, reject) => {

			if (undefined == timer) {

				self.neb.api.sendRawTransaction({
					data: tx.toProtoString()
				}).then((result) => {
					resolve(result)
				}).catch((err) => {

					self.log("transaction send gets error, retrying", 'error');
					setTimeout(() => {
						reject(err)
					}, self.timeout);
				})
			} else {
				setTimeout(() => {
					self.neb.api.sendRawTransaction({
						data: tx.toProtoString()
					}).then((result) => {
						resolve(result)
					}).catch((err) => {
						self.log("transaction send gets error, retrying after " + (self.timeout / 1000) + ' second', 'error');
						setTimeout(() => {
							reject(err)
						}, self.timeout);
					})
				}, timer)
			}
		}, times)

	}

	/**
	 * generate signed transaction from data
	 * @param {object} txData 
	 */
	this.tx = function (txData) {
		let data = {
			chainID: apiNet == undefined ? 1 : 10001,
			value: 0,
			gasPrice: 1000000,
			gasLimit: 200000,
		};
		Object.assign(data, txData);
		var tx = new Nebulas.Transaction(data);
		tx.signTransaction();
		return tx;
	}




	this.start = function () {
		var self=this;

		// define promise rety
		Object.defineProperty(Promise, 'retry', {
			configurable: true,
			writable: true,
			value: function retry(executor, retries) {
				const promise = new Promise(executor)
				if (retries > 0 || retries == undefined) {
					return promise.catch(error => {
						if(null!= error){

							self.log("\n\n")
							self.log(JSON.stringify(error),"error");
							self.log("\n\n")
						}
						return Promise.retry(executor, undefined == retries ? undefined : --retries)
					})
				}

				return promise
			}
		})
		this.neb = new Nebulas.Neb();
		this.neb.setRequest(new Nebulas.HttpRequest(apiNet == undefined ? "https://mainnet.nebulas.io" : "https://" + apiNet + ".nebulas.io"));


	}
	this.start()


}

module.exports = NasHelper;