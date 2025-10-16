"use client";

import { useEffect, useState, useRef } from "react";

export default function Cosmo() {
  var [messages, setMessages] = useState<Account[]>([]);
  var ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8080/connect");

    socket.onopen = () => {
      console.log("Connected to WebSocket Server");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const itemData: Account = {
          name: data.name, symbol: data.symbol, uri: data.uri, mint: data.mint
        }
        setMessages((prev) => [itemData, ...prev]);
      } catch {
        setMessages((prev) => [event.data, ...prev]);
      }
    };

    socket.onerror = (err) => {
      console.log("WebSocket error:", err);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
    };

    ws.current = socket;

    setInterval(() => {
      setMessages((prev) => prev.slice(0,10))
    },60000)

    return () => {
      socket.close();
    };
  }, []);

  return (
    <main className="p-6">
      <div className="grid grid-rows-2" >
        <div className="row-6" >
          <h1 className="text-xl font-bold mb-3">Cosmo</h1>
        </div>
        <div className="row-6 flex justify-end" >
          <button onClick={() => window.location.href = '/transfer'} type="button" className="max-w-50 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800">Transfer</button>
        </div>
      </div>
      <div className="p-3 h-140 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-400">Wait for new Feeds</p>
        ) : (
          messages.map((itemData, i) => (
            <div className="p-6 mb-2 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{itemData?.name}</h5>
              <p>Symbol: {itemData?.symbol}</p>
              <p>Uri: {itemData?.uri}</p>
              <p>Mint: {itemData?.mint}</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
