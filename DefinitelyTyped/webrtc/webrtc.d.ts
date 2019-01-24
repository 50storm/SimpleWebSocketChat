interface Navigator {
	getUserMedia(constraints: constObj, successCallback: (stream: any)=>void, errorCallback: (err: any)=>void);
	webkitGetUserMedia(constraints: constObj, successCallback: (stream: any)=>void, errorCallback: (err: any)=>void);
	mozGetUserMedia(constraints: constObj, successCallback: (stream: any)=>void, errorCallback: (err: any)=>void);
	msGetUserMedia(constraints: constObj, successCallback: (stream: any)=>void, errorCallback: (err: any)=>void);
}

interface constObj {
	video: boolean;
	audio: boolean;
}

interface Window {
//	URL: URL;
	webkitURL: URL;
}

interface URL{
	createObjectURL(stream: any);
}
