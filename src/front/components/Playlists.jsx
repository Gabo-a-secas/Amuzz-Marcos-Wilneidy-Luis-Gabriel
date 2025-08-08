import React, { useEffect, useState } from "react";
import { getUserPlaylists } from "../store";
import useGlobalReducer from "../hooks/useGlobalReducer";

const Playlists = () => {
  const { store } = useGlobalReducer();
  const [playlists, setPlaylists] = useState([]);

  console.log("Token del localStorage:", localStorage.getItem("token"));

  useEffect(() => {
    if (!store.token) return;

    getUserPlaylists(store.token).then(data => {
      if (data) setPlaylists(data);
    });
  }, [store.token]);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Playlists</h2>
      {playlists.length === 0 ? (
        <p>You don't have any yet, create a new one!</p>
      ) : (
        <ul>
          {playlists.map(p => (
            <li key={p.id} className="mb-2">
              <strong>{p.name}</strong> - {p.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Playlists;
