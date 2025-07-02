"use client"
import React, { useEffect } from 'react'

function VerificationPage() {
    useEffect(() => {
        setTimeout(() => {
            //force hard reload (client side rendering issues :/)
            window.location.href = '/';
        }, 1000);
    }, []);

    return (
        <div>Redirecting...</div>
    )
}

export default VerificationPage