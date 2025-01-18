"use client";

import { ReactNode, createContext, useContext } from "react";

type Props = {
	children: ReactNode;
	nonce: string | undefined;
};

export const NonceProvider = ({ children, nonce }: Props) => {
	return <NonceContext value={nonce}>{children}</NonceContext>;
};

const NonceContext = createContext<string | undefined>(undefined);

export const useNonce = () => {
	return useContext(NonceContext);
};
