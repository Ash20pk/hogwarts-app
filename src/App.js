import React, { useState, useEffect } from "react";
import Web3 from "web3";
import HogwartsNFT from "./HogwartsNFT.json"; // import default export
import HogwartsLogo from "./hogwarts_logo.png"; // import the image
import "./App.css";

const web3 = new Web3(window.ethereum);

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [house, setHouse] = useState("");
  const [house_slogan, sethouseSlogan] = useState("");
  const [minted, setMinted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false); // initialize loading state to true


  useEffect(() => {
    if (window.ethereum) {
      setConnected(true); // set the initial connection status to true
      window.ethereum.on("accountsChanged", (accounts) => {
        // update the connection status when the user changes accounts
        setAccount(accounts[0]);
        setConnected(true);
      });
      window.ethereum.on("disconnect", () => {
        // update the connection status when the user disconnects
        setAccount("");
        setConnected(false);
      });
      window.ethereum.enable().then((accounts) => {
        setAccount(accounts[0]);
        const contractAddress = "0x32ff855a7cc4422d7fc2ee8b28c362b6e5282071";
        const contractInstance = new web3.eth.Contract(
          HogwartsNFT.abi,
          contractAddress
        );
        setContract(contractInstance);
      });
    } else {
      alert("Please install MetaMask to use this app!");
    }
  }, []);
  

  useEffect(() => {
    if (contract && account) {
      getHouse();
      getHouseSlogan();
      checkMinted();
    }
  }, [contract, account]);

  const disconnectMetamask = async () => {
    try {
      await window.ethereum.enable();
      setConnected(false);
      setAccount("");
      setHouse("");
      sethouseSlogan("");
    } catch (err) {
      console.error(err);
    }
  };

  const connectMetamask = async () => {
    try {
      await window.ethereum.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
      setConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  // function to request an NFT from the contract
  const requestNFT = () => {
    contract.methods
      .requestNFT()
      .send({ from: account, value: web3.utils.toWei("0", "ether") }) //if you add mint fees to the contract change this number accordingly
      .on("receipt", function(receipt) {
        console.log("Transaction successful:", receipt.transactionHash);
        setMinted(true);
      })
      .on("error", (error) => {
        console.error("Error requesting NFT:", error);
      });
  };
  
  //function to get the house of the contract
  const getHouse = async () => {
    setLoading(true);
    const addressToHouse = ["You might belong in Gryffindor....", "You might belong in Hufflepuff....", "You might belong in wise old Ravenclaw....", "You belong perhaps in Slytherin...."];
    const houseIndex = await contract.methods.s_addressToHouse(account).call();
    setHouse(addressToHouse[houseIndex]);
    setLoading(false);
  };

    //function to get the house of the contract
    const getHouseSlogan = async () => {
      setLoading(true);
      const sloganToHouse = [    "Where dwell the brave at heart. Their daring, nerve, and chivalry, Set Gryffindors apart.",    "Where they are just and loyal. Those patient Hufflepuffs are true And unafraid of toil.",    "If you’ve a ready mind. Where those of wit and learning, Will always find their kind.",    "You’ll make your real friends. Those cunning folks use any means, To achieve their ends."  ];      const houseSloganIndex = await contract.methods.s_addressToHouse(account).call();
      sethouseSlogan(sloganToHouse[houseSloganIndex]);
      setLoading(false);
    };
  
  // function to check if the user has minted an NFT
  const checkMinted = async () => {
    const minted = await contract.methods.balanceOf(account).call();
    if (minted >= 1){
      setMinted(true);
    }
  };
  
  return (
    <div className="App">
      <img className="Hogwarts-logo" src={HogwartsLogo} alt="Hogwarts Logo" />
      <h1>Welcome to Hogwarts</h1>
  
      {connected ? (
        <>
          {minted ? (
            <>
              {loading ? (
                // display a loading message while the data is being loaded
                <p>hmmmm...let me think</p>
              ) : (
                // display the house and slogan when the data is loaded
                <>
                  <p>{house}</p>
                  {house_slogan.split('. ').map((slogan, index) => (
                    <p key={index}>{slogan}</p>
                  ))}
                </>
              )}
            </>
          ) : (
            <button onClick={requestNFT}>Let's choose your house</button>
          )}
          <button className="metamask-button" onClick={disconnectMetamask}>
            disconnect wallet
          </button>
        </>
      ) : (
        <button className="metamask-button" onClick={connectMetamask}>
          connect wallet
        </button>
      )}
    </div>
  );
}
    
    export default App;   