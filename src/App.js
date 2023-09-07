import React, { useState, useEffect } from "react";
import Web3 from "web3";
import HogwartsNFT from "./artifacts/HogwartsNFT.json"; 
import RandomHouseAssignment from "./artifacts/RandomHouseAssignment.json"; 
import HogwartsLogo from "./hogwarts_logo.png"; // import the image
import "./App.css";

//import audio
import gryffindorSound from "./sounds/gryffindor.mp3";
import hufflepuffSound from "./sounds/hufflepuff.mp3";
import ravenclawSound from "./sounds/ravenclaw.mp3";
import slytherinSound from "./sounds/slytherin.mp3";
import thinkingSound from "./sounds/thinking.mp3"; 


const web3 = new Web3(window.ethereum);

function App() {
  const [account, setAccount] = useState("");
  const [hogwartsContract, setHogwartsContract] = useState(null);
  const [randomHouseContract, setRandomHouseContract] = useState(null);  
  const [house, setHouse] = useState("");
  const [house_slogan, sethouseSlogan] = useState("");
  const [minted, setMinted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [checkMintedSuccess, setCheckMintSuccess] = useState(0);
  const [counter, setCounter] = useState(30);
  const [displayCounter, setDisplayCounter] = useState(false);

  //initialize audio
  const thinkingAudio = new Audio(thinkingSound);
  const gryffindorAudio = new Audio(gryffindorSound);
  const hufflepuffAudio = new Audio(hufflepuffSound);
  const ravenclawAudio = new Audio(ravenclawSound);
  const slytherinAudio = new Audio(slytherinSound);

  const defaultLoadingMessage = "Ah, right then... hmm... right";
  const dynamicLoadingMessage = `Ahh seems difficult...${counter}`;
  
  useEffect(() => {
    if (window.ethereum) {
      setConnected(true);
      window.ethereum.on("accountsChanged", (accounts) => {
        // update the connection status when the user changes accounts
        setAccount(accounts[0]);
        setConnected(true);
      });
      window.ethereum.on("disconnect", () => {
        // update the connection status when the user disconnects
        setAccount("");
        setConnected(false);
        setMinted(false); // Reset the minted state when the user disconnects
      });
      window.ethereum.enable().then((accounts) => {
        setAccount(accounts[0]);
        const hogwartsAddress = "0x798C46Fb6B1DaB71A2AbBDa2019351D8a91FE8D6";
        const randomHouseAddress = "0x310c7670c1360a2e4FC7F139FC79A2214bCD81eE";

      const hogwartsInstance = new web3.eth.Contract(
        HogwartsNFT.abi,
        hogwartsAddress
      );
      const randomHouseInstance = new web3.eth.Contract(
        RandomHouseAssignment.abi,
        randomHouseAddress
      );

      setHogwartsContract(hogwartsInstance);
      setRandomHouseContract(randomHouseInstance);
    
      checkMinted(); // Check for a minted NFT when the app first loads
      getHouseData(); //Refresh the house data
      });
    } else {
      alert("Please install MetaMask to use this app!");
    }
  }, []);

  useEffect(() => {
    if (hogwartsContract|| randomHouseContract || account) {
      getHouseData();
      checkMinted();
    }
  }, [account]);

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

  const requestNFT = () => {
    randomHouseContract.methods
        .requestNFT()
        .send({ from: account, value: web3.utils.toWei("0", "ether") })
        .on("transactionHash", function (hash) {
            console.log("Transaction sent. Transaction hash:", hash);
            setLoading(true); // Set loading to true before sending the transaction

            // Play the thinking sound once the transaction is sent (user pays for the transaction)
            thinkingAudio.play();
        })
        .on("receipt", function (receipt) {
            console.log("Transaction successful:", receipt.transactionHash);
            checkNewMinted();
  
        })
        .on("error", (error) => {
            console.error("Error requesting NFT:", error);
            setLoading(false); // Set loading back to false if there's an error during the transaction
        });
};
  
  //function to get the house of the contract
  const getHouseData = async () => {
    setLoading(true);
    const addressToHouse = ["You belong in Gryffindor....", "You belong in Hufflepuff....", "You belong in wise old Ravenclaw....", "You belong perhaps in Slytherin...."];
    const houseIndex = await hogwartsContract.methods.getHouseIndex(account).call();
    setHouse(addressToHouse[houseIndex]);
    const sloganToHouse = [ "Where dwell the brave at heart. Their daring, nerve, and chivalry, Set Gryffindors apart.",    "Where they are just and loyal. Those patient Hufflepuffs are true And unafraid of toil.",    "you’ve a ready mind. Where those of wit and learning, Will always find their kind.",    "You’ll make your real friends. Those cunning folks use any means, To achieve their ends."  ];      
    sethouseSlogan(sloganToHouse[houseIndex]);

    switch (houseIndex) {
      case '0':
        gryffindorAudio.play();
        break;
      case '1':
        hufflepuffAudio.play();
        break;
      case '2':
        ravenclawAudio.play();
        break;
      case '3':
        slytherinAudio.play();
        break;
      default:
        break;
    }
    setLoading(false);
  };

  // function to check if the user has minted an NFT
  const checkMinted = async () => {
    const minted = await hogwartsContract.methods.hasMintedNFT(account).call();
    console.log(minted);
    if (minted === true){
      setMinted(true);
      getHouseData();
      setLoading(false);
    }
    else
    setMinted(false);
  };

  // function to check if the user has minted an NFT
  const checkNewMinted = async () => {
      setDisplayCounter(true);  // Set this to true here
      setTimeout(async() => {
      const minted = await hogwartsContract.methods.hasMintedNFT(account).call();
      console.log(minted, checkMintedSuccess);
      if (minted === true){
        setMinted(true);
        getHouseData();
        setLoading(false);
        setCounter(3); // Reset the counter
        setDisplayCounter(false);  // Reset to false once confirmed
      }
      else if(checkMintedSuccess < 3){
        setCheckMintSuccess(prev=>prev+1);
        setCounter(prev => prev - 1);  // Decrement the counter
        checkNewMinted();}
      }, 800);
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
                <p>{displayCounter ? (counter ? dynamicLoadingMessage : defaultLoadingMessage) : defaultLoadingMessage}</p>
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
            
            <>
              {!loading && <button onClick={requestNFT} disabled={minted}>Let's choose your house</button>}
              {loading && <p className="loading-button-msg">{displayCounter ? (counter ? dynamicLoadingMessage : defaultLoadingMessage) : defaultLoadingMessage}</p>}

            </>
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