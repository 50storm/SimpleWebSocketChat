declare class Peer {
	constructor(id?: string, options?: peerOptions);
	constructor(options: peerOptions);
	connect(id: any, options?: connectOptions): DataConnection;
	call(id: any, stream: any): MediaConnection;
	on(event: string, callback: ()=>void): void;
	on(event: string, callback: (data: any)=>any): void;
	disconnect(): void;
	destroy(): void;
	id: string;
	connections: Object;
	disconnected: boolean;
	destroyed: boolean;
}


interface peerOptions {
	key?: string;
	host?: string;
	port?: number;
	path?: string;
	secure?: string;
	config?: Object;
	debug?: number;
}


interface connectOptions {
	label?: string;
	metadata?: any;
	serialization?: string;
	reliable?: boolean;
}


interface DataConnection {
	send(data: any): void;
	close(): void;
	on(event: string, callback: ()=>void): void;
	on(event: string, callback: (data: any)=>void): void;
	bufferSize: number;
	dataChannel: Object;
	label: string;
	metadata: any;
	open: boolean;
	peerConnection: Object;
	peer: string;
	reliable: boolean;
	serialization: string;
	type: string;
}


interface MediaConnection {
	answer(stream?: any): void;
	close(): void;
	on(event: string, callback: ()=>void): void;
	on(event: string, callback: (data: any)=>void): void;
	open: boolean;
	metadata: any;
	peer: string;
	type: string;
}

interface util {
	browser: string;
	supports: utilSupportObject;
}

interface utilSupportObject {
	audioVideo: boolean;
	data: boolean;
	binary: boolean;
	reliable: boolean;
}

