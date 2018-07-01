var NasHelper = require('./helper');

var nas = new NasHelper();
//set console.log debug messages
nas.setDebug();


//generate two address
nas.createAddress().then((wallet1) => {
	nas.createAddress().then((wallet2) => {
		console.log("wallet1 :", wallet1);
		console.log("\n\n")
		//lets gate wallet 1 state

		console.log("wallet2 :", wallet2);
		console.log("\n\n")
		nas.getState(wallet1.address).then((state) => {
			console.log('wallet 1 state is ' + JSON.stringify(state));;
			console.log("\n\n")
			//generate transaction from wallet 1 to wallet 2;
			var tx = nas.tx({
				from: nas.unlock(wallet1.json, wallet1.pass),
				to: wallet2.address,
				nonce: state.nonce + 1, //it cames from getState
				value: 0,
				gasLimit: 0,//only for test
			});

			console.log('tx generated ', tx);;
			console.log("\n\n")
			nas.sendTx(tx).then((txdata) => {
				console.log('tx sended ', txdata);;
				console.log("\n\n")
				nas.txStatus(txdata.txhash).then((completeData)=>{
					
					console.log('tx completed ', completeData);;
					console.log("\n\n")
				})
			})
		})


	})
})

