import React, { useState, useEffect, useCallback } from "react";
import Web3 from "web3";
import HogwartsNFT from "./HogwartsNFT.json";
import HogwartsLogo from "./hogwarts_logo.png";
import "./App.css";
import thinkingSound from "./thinking.mp3";
import gryffindorSound from "./gryffindor.mp3"; 
import slytherinSound from "./slytherin.mp3";
import ravenclawSound from "./ravenclaw.mp3";
import hufflepuffSound from "./hufflepuff.mp3";

const web3 = new Web3(window.ethereum);

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [house, setHouse] = useState("");
  const [house_slogan, sethouseSlogan] = useState("");
  const [minted, setMinted] = useState(false);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false); 

//Audio Files
  const thinkingAudio = new Audio(thinkingSound);
  const gryffindorAudio = new Audio(gryffindorSound); 
  const slytherinAudio = new Audio(slytherinSound); 
  const ravenclawAudio = new Audio(ravenclawSound); 
  const hufflepuffAudio = new Audio(hufflepuffSound);

  const houseAudioMap = {
    0: thinkingAudio,
    1: gryffindorAudio,
    2: hufflepuffAudio,
    3: ravenclawAudio,
    4: slytherinAudio,
  };
  

  const getHouse = useCallback(async () => {
    setLoading(true);
    const addressToHouse = ["You might belong in Gryffindor....", "You might belong in Hufflepuff....", "You might belong in wise old Ravenclaw....", "You belong perhaps in Slytherin...."];
    const houseIndex = await contract.methods.s_addressToHouse(account).call();
    setHouse(addressToHouse[houseIndex]);
    setLoading(false);  
  }, [contract, account]);

  const getHouseSlogan = useCallback(async () => {
    setLoading(true);
    const sloganToHouse = ["Where dwell the brave at heart. Their daring, nerve, and chivalry, Set Gryffindors apart.",    "Where they are just and loyal. Those patient Hufflepuffs are true And unafraid of toil.",    "If you’ve a ready mind. Where those of wit and learning, Will always find their kind.",    "You’ll make your real friends. Those cunning folks use any means, To achieve their ends."  ];      
    const houseSloganIndex = await contract.methods.s_addressToHouse(account).call();
    sethouseSlogan(sloganToHouse[houseSloganIndex]);
    setLoading(false);
  }, [contract, account]);

  const checkMinted = useCallback(async () => {
    const minted = await contract.methods.balanceOf(account).call();
    if (minted > 0){
      setMinted(true);
      getHouse();
      getHouseSlogan();
    }
    else
    setMinted(false);
  }, [contract, account, getHouse, getHouseSlogan]);

  useEffect(() => {
    if (window.ethereum) {
      setConnected(true);
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0]);
        setConnected(true);
      });
      window.ethereum.on("disconnect", () => {
        setAccount("");
        setConnected(false);
        setMinted(false);
      });
      window.ethereum.enable().then((accounts) => {
        setAccount(accounts[0]);
        const contractAddress = "0x32ff855a7cc4422d7fc2ee8b28c362b6e5282071";
        const contractInstance = new web3.eth.Contract(
          HogwartsNFT.abi,
          contractAddress
        );
        setContract(contractInstance);
        checkMinted();
      });
    } else {
      alert("Please install MetaMask to use this app!");
    }
  }, []);

  useEffect(() => {
    if (contract || account) {
      checkMinted();
    }
  }, [contract, account, checkMinted]);

  useEffect(() => {
    if (minted) {
      getHouse();
      getHouseSlogan();
    }
  }, [minted, getHouse, getHouseSlogan]);

  // Update the useEffect to monitor changes in house and slogan data
  useEffect(() => {
    if (house !== "" && house_slogan !== "") {
      setDataLoaded(true);
    }
  }, [house, house_slogan]);

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
    contract.methods
      .requestNFT()
      .send({ from: account, value: web3.utils.toWei("0", "ether") }) //if you add mint fees to the contract change this number accordingly
      .on("transactionHash", function(hash) {
        console.log("Transaction sent. Transaction hash:", hash);
        setLoading(true); // Set loading to true before sending the transaction

        // Play the thinking sound once the transaction is sent (user pays for the transaction)
        thinkingAudio.play();
      })
      .on("receipt", function(receipt) {
        console.log("Transaction successful:", receipt.transactionHash);
        setMinted(true);
        getHouse();
        getHouseSlogan();
       
        // Play the house-specific audio after the transaction is confirmed
        if (house !== "" && houseAudioMap.hasOwnProperty(house)) {
          houseAudioMap[house].play();
        }

        if(dataLoaded){
          setLoading(false); // Set loading back to false after the transaction is confirmed
        }
      })
      .on("error", (error) => {
        console.error("Error requesting NFT:", error);
        setLoading(false); // Set loading back to false if there's an error during the transaction
      });
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
              // Display a loading message while the data is being loaded
              <p>Ah, right then... hmm... right</p>
            ) : dataLoaded ? (
              // Display the house and slogan when the data is loaded
              <>
                <p>{house}</p>
                {house_slogan.split('. ').map((slogan, index) => (
                  <p key={index}>{slogan}</p>
                ))}
              </>
            ) : (
              // Fallback case when loading is complete but data hasn't loaded yet
              <p>Hmm seems difficult</p>
            )}
          </>
        ) : (
          <button disabled={loading || minted} // Disable the button while loading or if already minted
          onClick={requestNFT}>Let's choose your house </button>
        )}
        <button className="metamask-button" onClick={disconnectMetamask}>
          Disconnect Wallet
        </button>
      </>
    ) : (
      <button className="metamask-button" onClick={connectMetamask}>
        Connect Wallet
      </button>
    )}
  </div>
);
}

export default App;
