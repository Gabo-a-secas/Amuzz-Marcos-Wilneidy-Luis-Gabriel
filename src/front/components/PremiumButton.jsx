import React from "react";
import BackendURL from "./BackendURL";


const PremiumButton = () => {
    const handlePayment = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await fetch(
                `${BackendURL}api/create-checkout-session`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` })
                    }
                }
            );

            const text = await response.text();
            console.log("Texto crudo recibido:", text);

            if (!response.ok) {
                console.error("Error HTTP:", response.status, text);
                return;
            }

            const data = JSON.parse(text);


            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("Stripe session error:", data.error || "URL no recibida");
            }
        } catch (error) {
            console.error("Error al procesar el pago:", error);
        }
    };



    return (
        <button onClick={handlePayment} className="navbar-btn navbar-btn-outline">
            Apóyanos
        </button>
    );
};

export default PremiumButton;
