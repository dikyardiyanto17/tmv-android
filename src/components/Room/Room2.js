import { useEffect, useRef, useState } from 'react';
import {
    Button,
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    Animated,
    Image,
    TextInput,
    Modal,
    ActivityIndicator,
    Alert,
    BackHandler,
    AppState,
    AppRegistry
} from 'react-native';
import Check from '../../assets/pictures/Check.json';
import { registerGlobals, mediaDevices, RTCView, MediaStream } from 'react-native-webrtc';
import Video from './Video/Video';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { StackActions, useRoute, NavigationAction, useIsFocused } from '@react-navigation/native';
import socketIO from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { encodingVP8, encodingsVP9, params, audioParameters } from '../../config/mediasoup';
import { socket } from '../../socket';
import UserList from './UserList/UserList';
import HangUpButton from '../../assets/pictures/hangUp.png';
import VideoOff from './Video/VideoOff';
import WarningModal from '../Modal/WarningModal';
import AudioObserver from './Audio/AudioObserver';
import ScreenSharingButton from '../../assets/pictures/share.png';
import notifee, { AndroidImportance } from '@notifee/react-native';

registerGlobals();

function StopScreenShare() {
    return (
        <View>
            <Text>Stop ScreenShare</Text>
        </View>
    );
}

AppRegistry.registerComponent('stop-screen-share-component', () => StopScreenShare());

export default function Room2({ navigation }) {
    const isFocused = useIsFocused();
    const route = useRoute();
    const [isMicLocked, setIsMicLocked] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isUserScreenSharing, setIsUserScreenSharing] = useState(false);
    const [proccessCreateTransport, setProccessCreateTransport] = useState(false);
    const { id, username, microphone, cameraDeviceId } = route.params;
    const [loading, setLoading] = useState(true);
    const [warningTitle, setWarningTitle] = useState('');
    const [warningMessage, setWarningMessage] = useState('');
    const [warningDisplay, setWarningDisplay] = useState(false);
    const [myUsername, setMyUsername] = useState(username);
    const [myPicture, setMyPicture] = useState('/assets/pictures/unknown.jpg');
    const [myStream, setMyStream] = useState(null);
    const [allStreams, setAllStreams] = useState([]);
    const [socketIds, setSocketIds] = useState(undefined);
    const [micCondition, setMicCondition] = useState(true);
    const [cameraCondition, setCameraCondition] = useState(true);
    const [userListCondition, setUserListCondition] = useState(false);
    const [chatCondition, setChatCondition] = useState(false);
    const [displayUserCondition, setDisplayUserCondition] = useState(false);
    const [audioProducerId, setAudioProducerId] = useState('');
    const [videoProducerId, setVideoProducerId] = useState('');
    const [producerTransport, setProducerTransport] = useState(null);
    const [consumerTransport, setConsumerTransport] = useState(null);
    const [audioProducer, setAudioProducer] = useState(null);
    const [videoProducer, setVideoProducer] = useState(null);
    const [device, setDevice] = useState(null);
    const [rtpCapability, setRtpCapability] = useState(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [consumingTransports, setConsumingTransports] = useState([]);
    const [consumerTransports, setConsumerTransports] = useState([]);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [videoParam, setVideoParam] = useState({
        ...params,
        appData: {
            label: 'video',
            isActive: cameraDeviceId ? true : false,
            isMicActive: microphone,
            isVideoActive: cameraDeviceId ? true : false,
            picture: '/assets/pictures/unknown.jpg'
        }
    });
    const [audioParam, setAudioParam] = useState({
        ...audioParameters,
        appData: {
            label: 'audio',
            isActive: microphone,
            isMicActive: microphone,
            isVideoActive: cameraDeviceId ? true : false,
            picture: '/assets/pictures/unknown.jpg'
        }
    });
    const [screenSharingParam, setScreenSharingParam] = useState({ appData: { label: 'screensharing', isActive: true } });
    const [screenSharingAudioParam, setScreenSharingAudioParam] = useState({ appData: { label: 'screensharingaudio', isActive: true } });
    const [userScreenSharingStream, setUserScreenSharingStream] = useState(null);
    const [screenSharingVideoProducer, setScreenSharingVideoProducer] = useState(null);
    const [screenSharingAudioProducer, setScreenSharingAudioProducer] = useState(null);

    const slideLeftAnimation = useRef(new Animated.Value(0)).current;
    const slideRightAnimation = useRef(new Animated.Value(0)).current;
    const upDownAnimation = useRef(new Animated.Value(0)).current;

    const slideLeftUserList = () => {
        Animated.timing(slideLeftAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true
        }).start();
        if (chatCondition) {
            slideLeftChat();
            setChatCondition(prev => {
                return false;
            });
        }
        if (displayUserCondition) {
            downUpUserVideo();
            setDisplayUserCondition(false);
        }
    };

    const slideRightUserList = () => {
        Animated.timing(slideLeftAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true
        }).start();
    };

    const slideLeftChat = () => {
        try {
            Animated.timing(slideRightAnimation, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true
            }).start();
        } catch (error) {
            console.log('- Error Sliding Left Chat : ', error);
        }
    };

    const slideRightChat = () => {
        try {
            Animated.timing(slideRightAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            }).start();
            if (userListCondition) {
                slideRightUserList();
                setUserListCondition(prev => {
                    return false;
                });
            }
            if (displayUserCondition) {
                downUpUserVideo();
                setDisplayUserCondition(false);
            }
        } catch (error) {
            console.log('- Error Sliding Right Chat : ', error);
        }
    };

    const upDownUserVideo = () => {
        try {
            Animated.timing(upDownAnimation, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            }).start();
            if (chatCondition) {
                slideLeftChat();
                setChatCondition(prev => {
                    return false;
                });
            }
            if (userListCondition) {
                slideRightUserList();
                setUserListCondition(prev => {
                    return false;
                });
            }
        } catch (error) {
            console.log('- Error Displaying User Video : ', error);
        }
    };

    const downUpUserVideo = () => {
        try {
            Animated.timing(upDownAnimation, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true
            }).start();
        } catch (error) {
            console.log('- Error Displaying User Video : ', error);
        }
    };

    const changeMic = ({ status }) => {
        allStreams.forEach(data => {
            if (data.socketId != socket.id) {
                socket.emit('mic-config', { sendTo: data.socketId, isMicActive: status, id: socket.id });
            }
        });
    };

    const micButtonEvent = () => {
        if (isMicLocked) {
            setWarningTitle('Forbidden Act!');
            setWarningMessage('Mic is muted by Host!');
            setWarningDisplay(true);
            setTimeout(() => {
                setWarningDisplay(false);
            }, 3000);
            return;
        }
        setMicCondition(prevState => {
            setMyStream(prevStream => {
                if (!prevState) {
                    prevStream.getAudioTracks()[0].enabled = true;

                    changeAppData({
                        data: { isActive: true, isMicActive: true, isVideoActive: cameraCondition },
                        remoteProducerId: audioProducerId
                    });
                } else {
                    prevStream.getAudioTracks()[0].enabled = false;
                    changeAppData({
                        data: { isActive: false, isMicActive: false, isVideoActive: cameraCondition },
                        remoteProducerId: audioProducerId
                    });
                }
                changeMic({ status: !prevState });
                return prevStream;
            });

            return !prevState;
        });
    };

    const cameraButtonEvent = async () => {
        const newVideo = await mediaDevices.getUserMedia({
            video: cameraDeviceId ? { facingMode: cameraDeviceId.facing, deviceId: cameraDeviceId.deviceId } : true
        });
        setMyStream(prevStream => {
            if (cameraCondition) {
                setVideoProducerId(prevState => {
                    socket.emit('close-producer-from-client', { id: prevState });
                    return null;
                });
                videoProducer.close();
                if (prevStream.getVideoTracks()[0]) {
                    prevStream.removeTrack(prevStream.getVideoTracks()[0]);
                }
                setVideoParam(prevParam => {
                    const newParam = {
                        ...prevParam,
                        track: null,
                        appData: {
                            isActive: false,
                            isVideoActive: false,
                            isMicActive: micCondition,
                            label: 'video',
                            picture: '/assets/pictures/unknown.jpg'
                        }
                    };
                    return newParam;
                });
                return prevStream;
            } else {
                const newStream = new MediaStream([...prevStream.getTracks(), newVideo.getVideoTracks()[0]]);
                setVideoParam(prevParam => {
                    const newParam = {
                        ...prevParam,
                        track: newStream.getVideoTracks()[0],
                        appData: {
                            isActive: true,
                            isVideoActive: true,
                            isMicActive: micCondition,
                            label: 'video',
                            picture: '/assets/pictures/unknown.jpg'
                        }
                    };

                    producerTransport.produce(newParam).then(producer => {
                        setVideoProducer(producer);
                        setVideoProducerId(producer.id);
                        return newParam;
                    });
                });
                return newStream;
            }
        });
        setCameraCondition(prevState => {
            return !prevState;
        });
    };

    const userListButtonEvent = () => {
        try {
            if (userListCondition) {
                slideRightUserList();
            } else {
                slideLeftUserList();
            }
            setUserListCondition(prevState => {
                return !prevState;
            });
        } catch (error) {
            console.log('- Error Controlling User List : ', error);
        }
    };

    const chatButtonEvent = () => {
        try {
            if (chatCondition) {
                slideLeftChat();
            } else {
                slideRightChat();
            }

            setChatCondition(prev => {
                return !prev;
            });
        } catch (error) {
            console.log('- Error On Chat Button : ', error);
        }
    };

    const displayUserButtonEvent = () => {
        try {
            if (displayUserCondition) {
                downUpUserVideo();
            } else {
                upDownUserVideo();
            }
            setDisplayUserCondition(prev => {
                return !prev;
            });
        } catch (error) {
            console.log('- Error Displaying User : ', error);
        }
    };

    const formatDateMessage = date => {
        try {
            // Get hours and minutes from the date
            let hours = date.getHours();
            let minutes = date.getMinutes();

            // Determine whether it's AM or PM
            const ampm = hours >= 12 ? 'pm' : 'am';

            // Convert hours to 12-hour format
            hours = hours % 12;
            hours = hours ? hours : 12; // Handle midnight (0 hours)

            // Add leading zero to minutes if necessary
            minutes = minutes < 10 ? '0' + minutes : minutes;

            // Construct the formatted string
            const formattedTime = hours + ':' + minutes + ' ' + ampm;

            return formattedTime;
        } catch (error) {
            console.log('- Error Formating Date : ', error);
        }
    };

    const sendChatEvent = () => {
        try {
            if (!message) {
                setWarningTitle('Failed To Send Message!');
                setWarningMessage('The message cannot be empty!');
                setWarningDisplay(true);
                setTimeout(() => {
                    setWarningDisplay(false);
                }, 3000);
                return;
            }
            const data = {
                currentUser: true,
                message: message,
                username: myUsername,
                date: new Date()
            };

            setMessages(prevState => {
                return [...prevState, data];
            });

            allStreams.forEach(data => {
                socket.emit('send-message', { message: message, sendTo: data.socketId, sender: myUsername, messageDate: new Date() });
            });

            setMessage('');
        } catch (error) {
            console.log('- Error Sending Chat : ', error);
        }
    };

    const hangUpButtonEvent = () => {
        try {
            if (screenSharingParam) {
                turnOffScreenSharing();
            }
            resetEverything()
                .then(message => {
                    console.log(message);
                    navigation.replace('Home');
                })
                .catch(error => {
                    console.log('- Error Hang Up : ', error);
                });
        } catch (error) {
            console.log('- Error Leaving Room : ', error);
        }
    };

    const screenSharingButtonEvent = async () => {
        try {
            if (isUserScreenSharing) {
                turnOffScreenSharing();
            } else {
                const channelId = await notifee.createChannel({
                    id: 'screen_capture',
                    name: 'Screen Capture',
                    lights: false,
                    vibration: false,
                    importance: AndroidImportance.DEFAULT
                });

                await notifee.displayNotification({
                    title: 'Screen Capture',
                    body: 'This notification will be here until you stop capturing.',
                    android: {
                        channelId,
                        asForegroundService: true,
                        actions: [
                            {
                                title: 'Stop Screen Share',
                                pressAction: {
                                    id: 'stop_screen_share',
                                    mainComponent: 'stop-screen-share-component'
                                }
                            }
                        ]
                    }
                });
                const newScreenSharingStream = await mediaDevices.getDisplayMedia();
                let newParam;
                setScreenSharingParam(prevState => {
                    newParam = { ...prevState, track: newScreenSharingStream.getVideoTracks()[0] };
                    return newParam;
                });

                let newScreenSharingProducer = await producerTransport.produce(newParam);
                newScreenSharingProducer.on('transportclose', () => {
                    console.log('transport closed so producer closed');
                });
                newScreenSharingProducer.on('trackended', () => {
                    console.log('track ended screen sharingj');
                    socket.disconnect();
                });
                setScreenSharingVideoProducer(prevProducer => {
                    return newScreenSharingProducer;
                });

                setIsScreenSharing(true);
                setIsUserScreenSharing(true);
                setUserScreenSharingStream(newScreenSharingStream);
            }
        } catch (error) {
            console.log('- Error Screen Sharing : ', error);
        }
    };

    const getMyStream = async () => {
        try {
            setTotalUsers(prevState => {
                return prevState + 1;
            });
            const mediaStream = await mediaDevices.getUserMedia({
                video: cameraDeviceId
                    ? {
                          facingMode: cameraDeviceId.facing,
                          deviceId: cameraDeviceId.deviceId
                      }
                    : false,
                audio: true
            });
            setMicCondition(microphone);
            setCameraCondition(cameraDeviceId ? true : false);
            mediaStream.getAudioTracks()[0].enabled = microphone;
            setMyStream(mediaStream);

            setAudioParam(prevState => {
                return { ...prevState, track: mediaStream.getAudioTracks()[0] };
            });

            setVideoParam(prevState => {
                return { ...prevState, track: cameraDeviceId ? mediaStream.getVideoTracks()[0] : null };
            });
        } catch (error) {
            console.log('- Error Getting Stream : ', error);
        }
    };

    const getEncoding = () => {
        try {
            const firstVideoCodec = device.rtpCapabilities.codecs.find(c => c.kind === 'video');

            let mimeType = firstVideoCodec.mimeType.toLowerCase();
            if (mimeType.includes('vp9')) {
                setVideoParam(prevState => {
                    return { ...prevState, encoding: encodingsVP9 };
                });
            } else {
                setVideoParam(prevState => {
                    return { ...prevState, encoding: encodingVP8 };
                });
            }
            return firstVideoCodec;
        } catch (error) {
            console.log('- Error Get Encoding : ', error);
        }
    };

    const createDevice = async () => {
        try {
            await device.load({
                routerRtpCapabilities: rtpCapability
            });
            setProccessCreateTransport(true);
        } catch (error) {
            console.log('- Error Creating Device : ', error);
        }
    };

    const createSendTransport = async () => {
        try {
            socket.emit(
                'create-webrtc-transport',
                {
                    consumer: false,
                    roomName: id
                },
                ({ params }) => {
                    setProducerTransport(prevTransport => {
                        const newProducerTransport = device.createSendTransport(params);
                        newProducerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                            try {
                                await socket.emit('transport-connect', {
                                    dtlsParameters
                                });

                                callback();
                            } catch (error) {
                                errback('- Error Connecting Transport : ', error);
                            }
                        });

                        newProducerTransport.on('produce', async (parameters, callback, errback) => {
                            try {
                                await socket.emit(
                                    'transport-produce',
                                    {
                                        kind: parameters.kind,
                                        rtpParameters: parameters.rtpParameters,
                                        appData: parameters.appData,
                                        roomName: id
                                    },
                                    ({ id, producersExist, kind }) => {
                                        callback({
                                            id
                                        });
                                        if (producersExist && kind == 'audio') getProducers();
                                    }
                                );
                            } catch (error) {
                                errback(error);
                            }
                        });

                        newProducerTransport.on('connectionstatechange', async e => {
                            try {
                                console.log('- State Change Producer : ', e);
                                if (e == 'failed') {
                                    setWarningTitle('Weak Connection!');
                                    setWarningMessage('Please make sure you have stable connection!');
                                    setWarningDisplay(true);
                                    setTimeout(() => {
                                        socket.disconnect();
                                        setWarningDisplay(false);
                                        navigation.goBack();
                                    }, 3000);
                                }

                                if (e == 'connected') {
                                    setLoading(false);
                                }
                            } catch (error) {
                                console.log('- Error Connecting State Change Producer : ', error);
                            }
                        });

                        return newProducerTransport;
                    });

                    socket.emit(
                        'create-webrtc-transport',
                        {
                            consumer: true,
                            roomName: id
                        },
                        ({ params }) => {
                            setConsumerTransport(prevConsumerTransport => {
                                const newConsumerTransport = device.createRecvTransport(params);

                                newConsumerTransport.on('connectionstatechange', async e => {
                                    console.log('- Receiver Transport State : ', e);
                                });

                                newConsumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                                    try {
                                        await socket.emit('transport-recv-connect', {
                                            dtlsParameters,
                                            serverConsumerTransportId: params.id
                                        });
                                        callback();
                                    } catch (error) {
                                        errback(error);
                                    }
                                });

                                return newConsumerTransport;
                            });
                        }
                    );
                }
            );
        } catch (error) {
            console.log('- Error Creating Send Transport : ', error);
        }
    };

    const connectSendTransport = async () => {
        try {
            // Producing Audio And Video Transport
            const newAudioProducer = await producerTransport.produce(audioParam);
            setAudioProducer(prevState => {
                newAudioProducer.on('trackended', () => {
                    console.log('audio track ended');
                });

                newAudioProducer.on('transportclose', () => {
                    console.log('audio transport ended');
                });
                setAudioProducerId(newAudioProducer.id);
                return newAudioProducer;
            });
            if (cameraDeviceId) {
                const newVideoProducer = await producerTransport.produce(videoParam);
                setVideoProducer(prevState => {
                    newVideoProducer.on('trackended', () => {
                        console.log('video track ended');
                    });

                    newVideoProducer.on('transportclose', () => {
                        console.log('video transport ended');
                    });
                    setVideoProducerId(newVideoProducer.id);
                    return newVideoProducer;
                });
            }

            // await parameter.videoProducer.setMaxSpatialLayer(1);
            // parameter.videoProducer.setMaxIncomingBitrate(900000)
        } catch (error) {
            console.log('- Error Connecting Transport Producer : ', error);
        }
    };

    const getProducers = () => {
        try {
            socket.emit('get-producers', { roomName: id }, producerList => {
                producerList.forEach(id => {
                    signalNewConsumerTransport({ remoteProducerId: id });
                });
            });
        } catch (error) {
            console.log('- Error Get Producer : ', error);
        }
    };

    const signalNewConsumerTransport = async ({ remoteProducerId }) => {
        try {
            if (consumingTransports.includes(remoteProducerId)) return;
            setConsumingTransports(prevState => {
                return [...prevState, remoteProducerId];
            });
            let totalReconnecting = 0;
            setConsumerTransport(cT => {
                const connectingRecvTransport = async () => {
                    if (!cT) {
                        totalReconnecting++;
                        setTimeout(() => {
                            connectingRecvTransport();
                        }, 1000);
                    } else if (totalReconnecting >= 20) {
                        console.log('Receiver Transport Wont Connected');
                    } else {
                        setDevice(prevState => {
                            connectRecvTransport({
                                remoteProducerId,
                                serverConsumerTransportId: cT.id,
                                consumerTransport: cT,
                                deviceRTP: prevState.rtpCapabilities
                            });
                            return prevState;
                        });
                    }
                };

                connectingRecvTransport();
                return cT;
            });
        } catch (error) {
            console.log('- Error Signaling New Consumer Transport : ', error);
        }
    };

    const connectRecvTransport = async ({ remoteProducerId, serverConsumerTransportId, consumerTransport, deviceRTP }) => {
        try {
            await socket.emit(
                'consume',
                {
                    rtpCapabilities: deviceRTP,
                    remoteProducerId,
                    serverConsumerTransportId,
                    roomName: id
                },
                async ({ params }) => {
                    try {
                        let streamId;
                        if (params?.appData?.label == 'audio' || params?.appData?.label == 'video') {
                            streamId = `${params.producerSocketOwner}-mic-webcam`;
                        } else {
                            streamId = `${params.producerSocketOwner}-screen-sharing`;
                        }

                        const consumer = await consumerTransport.consume({
                            id: params.id,
                            producerId: params.producerId,
                            kind: params.kind,
                            rtpParameters: params.rtpParameters,
                            streamId
                        });

                        const { track } = consumer;

                        if (!params?.appData?.isActive) {
                            track.enabled = false;
                        }

                        socket.emit('consumer-resume', {
                            serverConsumerId: params.serverConsumerId
                        });
                        setAllStreams(prevState => {
                            let newData = [...prevState];
                            const isExist = newData.find(data => data.socketId == params.producerSocketOwner);
                            let theStream = {
                                socketId: params.producerSocketOwner,
                                stream: new MediaStream(),
                                audio: { producerId: undefined, consumer: undefined, isActive: false },
                                video: { producerId: undefined, consumer: undefined, isActive: false },
                                screenSharingStream: null,
                                screensharing: {
                                    producerId: undefined,
                                    consumer: undefined,
                                    isActive: false
                                },
                                screensharingaudio: {
                                    producerId: undefined,
                                    consumer: undefined,
                                    isActive: false
                                },
                                username: params.username,
                                picture: params.appData.picture
                            };
                            if (isExist) {
                                theStream = isExist;
                            }
                            if (params.kind == 'audio' && params.appData.label == 'audio') {
                                setTotalUsers(prevState => {
                                    return prevState + 1;
                                });
                                theStream.audio.producerId = remoteProducerId;
                                theStream.audio.consumer = consumer;
                                theStream.stream.addTrack(track);
                                theStream.audio.isActive = params?.appData?.isActive;
                            }
                            if (params.kind == 'video' && params.appData.label == 'video') {
                                theStream.stream.addTrack(track);
                                theStream.video.producerId = remoteProducerId;
                                theStream.video.isActive = params?.appData?.isActive;
                            }
                            if (params.appData.label == 'screensharing') {
                                if (theStream.screenSharingStream) {
                                    theStream.screenSharingStream.addTrack(track);
                                } else {
                                    theStream.screenSharingStream = new MediaStream();
                                    theStream.screenSharingStream.addTrack(track);
                                }
                                theStream.screensharing.producerId = remoteProducerId;
                                theStream.screensharing.isActive = params?.appData?.isActive;
                                setIsScreenSharing(true);
                            }
                            if (params.kind == 'audio' && params.appData.label == 'screensharingaudio') {
                                if (theStream.screenSharingStream) {
                                    theStream.screenSharingStream.addTrack(track);
                                } else {
                                    theStream.screenSharingStream = new MediaStream();
                                    theStream.screenSharingStream.addTrack(track);
                                }
                                theStream.screensharingaudio.producerId = remoteProducerId;
                                theStream.screensharingaudio.isActive = params?.appData?.isActive;
                                setIsScreenSharing(true);
                            }
                            let findStream = newData.find(data => data.socketId === params.producerSocketOwner);
                            if (findStream) {
                                findStream = theStream;
                            } else {
                                newData.push(theStream);
                            }
                            return newData;
                        });
                    } catch (error) {
                        console.log('- Error Consuming : ', error);
                    }
                }
            );
        } catch (error) {
            console.log('- Error Connecting Receive Transport : ', error);
        }
    };

    const changeAppData = ({ data, remoteProducerId }) => {
        socket.emit('change-app-data', { data, remoteProducerId });
    };

    const resetEverything = async () => {
        try {
            setIsMicLocked(false);
            setIsScreenSharing(false);
            setIsUserScreenSharing(false);
            setProccessCreateTransport(false);
            setLoading(true);
            setWarningTitle('');
            setWarningMessage('');
            setWarningDisplay(false);
            setMyStream(prevState => {
                prevState?.getTracks()?.forEach(track => {
                    track?.stop();
                });
                return null;
            });
            setAllStreams(prevState => {
                return [];
            });
            setSocketIds(undefined);
            setMicCondition(true);
            setCameraCondition(true);
            setUserListCondition(false);
            setChatCondition(false);
            setDisplayUserCondition(false);
            setAudioProducerId('');
            setVideoProducerId(prevState => {
                return '';
            });
            setProducerTransport(prevState => {
                prevState?.close();
                return null;
            });
            setConsumerTransport(prevState => {
                prevState?.close();
                return null;
            });
            setAudioProducer(prevState => {
                prevState?.close();
                return null;
            });
            setVideoProducer(prevState => {
                prevState?.close();
                return null;
            });
            setDevice(null);
            setRtpCapability(null);
            setTotalUsers(0);
            setConsumingTransports([]);
            setConsumerTransports([]);
            setMessage('');
            setMessages([]);
            setVideoParam({
                ...params,
                appData: {
                    label: 'video',
                    isActive: cameraDeviceId ? true : false,
                    isMicActive: microphone,
                    isVideoActive: cameraDeviceId ? true : false,
                    picture: '/assets/pictures/unknown.jpg'
                }
            });
            setAudioParam({
                ...audioParameters,
                appData: {
                    label: 'audio',
                    isActive: microphone,
                    isMicActive: microphone,
                    isVideoActive: cameraDeviceId ? true : false,
                    picture: '/assets/pictures/unknown.jpg'
                }
            });
            setScreenSharingParam(null);
            setUserScreenSharingStream(null);
            setScreenSharingParam({ appData: { label: 'screensharing', isActive: true } });
            setScreenSharingAudioParam({ appData: { label: 'screensharingaudio', isActive: true } });
            setUserScreenSharingStream(null);
            setScreenSharingVideoProducer(null);
            setScreenSharingAudioProducer(null);
            socket.disconnect();
            return 'Successfully Disconnected';
        } catch (error) {
            console.log('- Failed To Reset Everything : ', error);
        }
    };

    const turnOffScreenSharing = async () => {
        try {
            screenSharingVideoProducer?.close();
            setScreenSharingVideoProducer(prevState => {
                socket.emit('close-producer-from-client', { id: prevState?.id });
                return null;
            });
            setIsScreenSharing(false);
            setIsUserScreenSharing(false);
            setUserScreenSharingStream(prevStream => {
                prevStream?.getTracks()?.forEach(track => {
                    track?.stop();
                });
                return null;
            });
            await notifee?.stopForegroundService();
            return 'Successfully Turn Off Screen Sharing';
        } catch (error) {
            console.log('- Error Turning Off Screen Sharing : ', error);
        }
    };

    useEffect(() => {
        return navigation.addListener('beforeRemove', () => {
            if (screenSharingVideoProducer) {
                turnOffScreenSharing();
            }
            resetEverything();
        });
    }, [navigation]);

    useEffect(() => {
        socket.connect();
        const notifeeEvent = async ({ type, detail }) => {
            try {
                if (detail?.pressAction?.id == 'stop_screen_share') {
                    await turnOffScreenSharing();
                }
            } catch (error) {
                console.log('- Error Notifee : ', error);
            }
        };
        const notifeeBackgroundEvent = async event => {
            try {
                if (event?.detail?.pressAction?.id == 'stop_screen_share') {
                    await turnOffScreenSharing();
                }
            } catch (error) {
                console.log('- Notify Background Event Type : ', error);
            }
        };
        notifee.onForegroundEvent(notifeeEvent);
        notifee.onBackgroundEvent(notifeeBackgroundEvent);
        return () => {
            resetEverything();
        };
    }, []);

    useEffect(() => {
        getMyStream();
        function onConnect({ socketId }) {
            setSocketIds(socketId);
            socket.emit('joinRoom', { roomName: id, username: myUsername }, data => {
                let rtpCapabilitiFromServer = data.rtpCapabilities;
                rtpCapabilitiFromServer.headerExtensions = data.rtpCapabilities.headerExtensions.filter(
                    ext => ext.uri !== 'urn:3gpp:video-orientation'
                );
                setRtpCapability(rtpCapabilitiFromServer);
                setDevice(new mediasoupClient.Device());
            });
        }

        const newProducer = ({ producerId, socketId }) => {
            signalNewConsumerTransport({ remoteProducerId: producerId });
        };

        const removeProducer = ({ remoteProducerId, socketId }) => {
            try {
                setAllStreams(prevState => {
                    let newData = [...prevState];
                    let updateData;

                    let checkData = prevState.find(data => data.socketId === socketId);

                    let kind;

                    for (const key in checkData) {
                        if (typeof checkData[key] == 'object' && checkData[key]) {
                            if (checkData[key].producerId == remoteProducerId) {
                                kind = key;
                            }
                        }
                    }

                    if (kind === 'video' && checkData) {
                        let updateVideo = newData.find(data => data.socketId == socketId);
                        if (updateVideo) {
                            updateVideo.video.producerId = null;
                            // updateVideo.stream.getVideoTracks()[0].stop()
                            updateVideo.stream.removeTrack(updateVideo.stream.getVideoTracks()[0]);
                            updateVideo.video.isActive = false;
                            return newData;
                        }
                    }

                    if (kind === 'screensharing' && checkData) {
                        let updateScreensharing = newData.find(data => data.socketId == socketId);
                        if (updateScreensharing) {
                            updateScreensharing.screensharing.producerId = null;
                            updateScreensharing.screensharing.isActive = false;
                            updateScreensharing.screenSharingStream = null;
                            setIsScreenSharing(false);
                            setDisplayUserCondition(false);
                            return newData;
                        }
                    }

                    if (kind === 'screensharingaudio' && checkData) {
                        let updateScreensharingaudio = newData.find(data => data.socketId == socketId);
                        if (updateScreensharingaudio) {
                            updateScreensharingaudio.screensharingaudio.producerId = null;
                            updateScreensharingaudio.screensharingaudio.isActive = false;
                            updateScreensharingaudio.screenSharingStream = null;
                            downUpUserVideo();
                            setIsScreenSharing(false);
                            setDisplayUserCondition(false);
                            return newData;
                        }
                    }

                    if (kind === 'audio' && checkData) {
                        if (checkData.screensharing.producerId) {
                            setIsScreenSharing(false);
                            setDisplayUserCondition(false);
                        }
                        updateData = newData.filter(data => data.socketId != socketId);
                        setTotalUsers(prevState => {
                            return prevState - 1;
                        });
                        return updateData;
                    }

                    if (!updateData) {
                        return newData;
                    }
                });
            } catch (error) {
                console.log('- Error Closing Producer : ', error);
            }
        };

        const changeMicStatus = ({ id, isMicActive }) => {
            try {
                setAllStreams(prevState => {
                    let newData = [...prevState];

                    let checkData = prevState.find(data => data.socketId === id);

                    if (checkData) {
                        checkData.stream.getAudioTracks()[0].enabled = isMicActive;
                        checkData.audio.isActive = isMicActive;
                        return newData;
                    }
                });
            } catch (error) {
                console.log('- Error Changing Mic Status : ', error);
            }
        };

        const receiveMessage = ({ message, sendTo, sender, messageDate }) => {
            try {
                const data = { currentUser: false, date: new Date(), username: sender, message: message };
                setMessages(prevState => {
                    return [...prevState, data];
                });
            } catch (error) {
                console.log('- Error Receiving Message : ', error);
            }
        };

        const mutedByHost = ({ hostSocketId }) => {
            try {
                setIsMicLocked(true);
                setMicCondition(prevState => {
                    setMyStream(prevStream => {
                        prevStream.getAudioTracks()[0].enabled = false;
                        changeAppData({
                            data: { isActive: false, isMicActive: false, isVideoActive: cameraCondition },
                            remoteProducerId: audioProducerId
                        });
                        changeMic({ status: false });
                        return prevStream;
                    });

                    return false;
                });
            } catch (error) {
                console.log('- Error Muted By Host : ', error);
            }
        };

        const unMutedByHost = data => {
            try {
                setIsMicLocked(false);
            } catch (error) {
                console.log('- Error Unmuted By Host : ', error);
            }
        };
        socket.on('connection-success', onConnect);
        socket.on('new-producer', newProducer);
        socket.on('producer-closed', removeProducer);
        socket.on('mic-config', changeMicStatus);
        socket.on('receive-message', receiveMessage);
        socket.on('mute-all', mutedByHost);
        socket.on('unmute-all', unMutedByHost);

        const onBackPress = () => {
            Alert.alert(
                'Exit App',
                'Do you want to exit?',
                [
                    {
                        text: 'Cancel',
                        onPress: () => {
                            // Do nothing
                        },
                        style: 'cancel'
                    },
                    {
                        text: 'YES',
                        onPress: () => {
                            socket.disconnect();
                            if (screenSharingVideoProducer) {
                                turnOffScreenSharing();
                            }
                            navigation.replace('Home');
                        }
                    }
                ],
                { cancelable: false }
            );

            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);

        socket.on('app-is-closed', ({ message }) => {
            console.log(message);
        });

        return () => {
            backHandler.remove();
            socket.off('connection-success', onConnect);
            socket.off('new-producer', newProducer);
            socket.off('producer-closed', removeProducer);
            socket.off('mic-config', changeMicStatus);
            socket.off('receive-message', receiveMessage);
            socket.off('mute-all', mutedByHost);
            socket.off('unmute-all', unMutedByHost);
        };
    }, [socket]);

    useEffect(() => {
        if (device) {
            createDevice();
        }
    }, [device]);

    useEffect(() => {
        if (proccessCreateTransport) {
            getEncoding();
            createSendTransport();
        }
    }, [proccessCreateTransport]);

    useEffect(() => {
        if (producerTransport) {
            connectSendTransport();
        }
    }, [producerTransport]);

    const videoLayoutCalcultaion = ({ totalUsers, type }) => {
        const { height, width } = Dimensions.get('window');
        const videoContainerHeight = (3 * height) / 4;
        if (type == 'current_user') {
            if (totalUsers == 1) {
                return {
                    width: width,
                    height: videoContainerHeight
                };
            } else if (totalUsers >= 3) {
                return {
                    width: (2 * width) / 5,
                    height: (2 * videoContainerHeight) / 5
                };
            } else {
                return {
                    width: (1.5 * width) / 5,
                    height: (1.5 * videoContainerHeight) / 5
                };
            }
        } else {
            if (totalUsers >= 1 && totalUsers <= 2) {
                return {
                    width: width,
                    height: videoContainerHeight
                };
            } else if (totalUsers >= 3) {
                return {
                    width: (2 * width) / 5,
                    height: (2 * videoContainerHeight) / 5
                };
            } else {
                return {
                    width: (4 * width) / 10,
                    height: (4 * videoContainerHeight) / 10
                };
            }
        }
    };

    const layoutCurrentUser = totalUser => {
        let heightWidth = videoLayoutCalcultaion({ totalUsers: totalUser, type: 'current_user' });
        if (totalUser == 1) {
            return {
                ...heightWidth,
                backgroundColor: 'black',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center'
            };
        } else if (totalUser >= 3) {
            return {
                ...heightWidth,
                backgroundColor: 'black',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center'
            };
        } else {
            return {
                ...heightWidth,
                backgroundColor: 'black',
                position: 'absolute',
                right: '0%',
                bottom: '0%',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 2
            };
        }
    };

    const layoutOtherUser = totalUser => {
        let heightWidth = videoLayoutCalcultaion({ totalUsers: totalUser, type: 'other_user' });
        if (totalUser == 1) {
            return {
                ...heightWidth,
                backgroundColor: 'black',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center'
            };
        } else if (totalUser == 2) {
            return {
                ...heightWidth,
                backgroundColor: 'black',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center'
            };
        } else if (totalUser >= 3) {
            return {
                ...heightWidth,
                backgroundColor: 'black',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center'
            };
        } else {
            return {
                ...heightWidth,
                backgroundColor: 'black',
                borderWidth: 1,
                borderRadius: 5,
                borderColor: 'white',
                justifyContent: 'center',
                alignItems: 'center'
            };
        }
    };

    return (
        <View style={styles.topContainer}>
            <Modal visible={loading ? true : false} transparent={true}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size={'large'} />
                </View>
            </Modal>
            <WarningModal display={warningDisplay} title={warningTitle} message={warningMessage} />
            <View style={styles.containerHeader}>
                <Text style={styles.title}>Room {id}</Text>
            </View>
            <View style={styles.middleContainers}>
                <Animated.View
                    style={[
                        styles.userListContainer,
                        {
                            transform: [
                                {
                                    translateX: slideLeftAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [width, 0]
                                    })
                                }
                            ]
                        }
                    ]}>
                    <Text style={styles.userListTitle}>User List</Text>
                    <UserList userImage={undefined} micIcon={micCondition} cameraIcon={cameraCondition} username={myUsername} />
                    {allStreams &&
                        allStreams.map(data => {
                            return (
                                <UserList
                                    key={data.socketId}
                                    userImage={data.picture}
                                    micIcon={data.audio.isActive}
                                    cameraIcon={data.video.isActive}
                                    username={data.username}
                                />
                            );
                        })}
                </Animated.View>
                <Animated.View
                    style={[
                        styles.chatContainer,
                        {
                            transform: [
                                {
                                    translateX: slideRightAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [2 * width, width * 3]
                                    })
                                }
                            ]
                        }
                    ]}>
                    <View style={styles.headerChat}>
                        <Text style={styles.chatTitle}>Chat Room</Text>
                    </View>
                    <ScrollView contentContainerStyle={styles.messageChatScroll} style={styles.messageChatScrollStyle}>
                        {messages &&
                            messages.map((data, index) => {
                                return (
                                    <View key={index} style={data.currentUser ? styles.senderMessageContainer : styles.receiverMessageContainer}>
                                        <View style={data.currentUser ? styles.senderMessageWrapper : styles.receiverMessageWrapper}>
                                            {data.username == messages[index - 1]?.username &&
                                            formatDateMessage(data.date) == formatDateMessage(messages[index - 1]?.date) ? (
                                                ''
                                            ) : (
                                                <Text style={data.currentUser ? styles.senderUsername : styles.receiverUsername}>
                                                    {data.username}
                                                </Text>
                                            )}
                                            <Text style={data.currentUser ? styles.senderMessage : styles.receiverMessage}>{data.message}</Text>
                                            {data.username == messages[index + 1]?.username &&
                                            formatDateMessage(data.date) == formatDateMessage(messages[index + 1]?.date) ? (
                                                ''
                                            ) : (
                                                <Text style={data.currentUser ? styles.senderMessageDate : styles.receiverMessageDate}>
                                                    {formatDateMessage(data.date)}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                    </ScrollView>
                    <View style={styles.footerChat}>
                        <TextInput style={styles.chatInput} placeholder="type message..." value={message} onChangeText={text => setMessage(text)} />
                        <Button title="Send" color={'grey'} onPress={sendChatEvent} />
                    </View>
                </Animated.View>
                <Animated.ScrollView
                    contentContainerStyle={styles.containerVideoScroll}
                    style={[
                        styles.containerVideoScrollStyle,
                        isScreenSharing
                            ? {
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  transform: [
                                      {
                                          translateY: upDownAnimation.interpolate({
                                              inputRange: [0, 1],
                                              outputRange: [-height, 0]
                                          })
                                      }
                                  ]
                              }
                            : {}
                    ]}>
                    {myStream && (
                        <View style={layoutCurrentUser(totalUsers)}>
                            <AudioObserver status={micCondition} transport={audioProducer} />
                            {cameraCondition ? <Video stream={myStream} user={true} /> : <VideoOff imgUser={myPicture} />}
                            <View style={styles.usernameContainer}>
                                <Text>{myUsername}</Text>
                            </View>
                        </View>
                    )}
                    {allStreams &&
                        allStreams.map(data => {
                            if (data.audio.producerId) {
                                return (
                                    <View key={data.socketId} style={layoutOtherUser(totalUsers)}>
                                        <AudioObserver status={data.stream.getAudioTracks()[0].enabled} transport={data.audio.consumer} />
                                        {data?.video?.isActive ? <Video stream={data.stream} user={true} /> : <VideoOff imgUser={data.picture} />}
                                        <View style={styles.usernameContainer}>
                                            <Text>{data.username}</Text>
                                        </View>
                                    </View>
                                );
                            }
                        })}
                </Animated.ScrollView>
                {isScreenSharing && (
                    <View style={[styles.screenSharingContainer]}>
                        {isUserScreenSharing ? (
                            <View>
                                <Text>Screen Sharing Is On Going</Text>
                                {/* <Video stream={userScreenSharingStream} user={false} /> */}
                            </View>
                        ) : (
                            allStreams.map((data, index) => {
                                if (data?.screenSharingStream) {
                                    return <Video stream={data?.screenSharingStream} key={index} user={false} />;
                                }
                            })
                        )}
                    </View>
                )}
            </View>
            <View style={styles.buttonContainer}>
                {isScreenSharing && (
                    <Pressable style={[styles.button, { backgroundColor: displayUserCondition ? 'green' : 'grey' }]} onPress={displayUserButtonEvent}>
                        <Icon name={'tv'} size={18} color="white" light />
                    </Pressable>
                )}
                <Pressable style={[styles.button, { backgroundColor: micCondition ? 'grey' : 'green' }]} onPress={micButtonEvent}>
                    <Icon name={micCondition ? 'microphone' : 'microphone-slash'} size={20} color="white" light />
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: cameraCondition ? 'grey' : 'green' }]} onPress={cameraButtonEvent}>
                    <Icon name={cameraCondition ? 'video' : 'video-slash'} size={20} color="white" light />
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: userListCondition ? 'green' : 'grey' }]} onPress={userListButtonEvent}>
                    <Icon name={'users'} size={20} color="white" light />
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: chatCondition ? 'green' : 'grey' }]} onPress={chatButtonEvent}>
                    <Icon name={'comments'} size={20} color="white" light />
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: isUserScreenSharing ? 'green' : 'grey' }]} onPress={screenSharingButtonEvent}>
                    <Image source={ScreenSharingButton} />
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: 'red' }]} onPress={hangUpButtonEvent}>
                    <Image source={HangUpButton} />
                </Pressable>
            </View>
        </View>
    );
}
const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
    topContainer: {
        flex: 1,
        backgroundColor: 'black',
        width: width
    },
    containerHeader: {
        flex: 0.1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        textAlign: 'center'
    },
    middleContainers: {
        flex: 0.75,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    containerVideoScroll: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        flexWrap: 'wrap',
        alignContent: 'center',
        rowGap: 20,
        width: width,
        zIndex: 2
    },
    containerVideoScrollStyle: {
        flex: 1,
        zIndex: 2,
        backgroundColor: 'black'
    },
    screenSharingContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: width,
        height: (3 * height) / 4,
        zIndex: 1
    },
    buttonContainer: {
        flex: 0.15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 100
    },
    button: {
        borderRadius: 40,
        backgroundColor: 'grey',
        padding: 10,
        aspectRatio: 1,
        height: 43,
        justifyContent: 'center',
        alignItems: 'center',
        margin: 5
    },
    usernameContainer: {
        backgroundColor: 'grey',
        borderRadius: 7,
        position: 'absolute',
        left: '2%',
        bottom: '2%',
        padding: 4
    },
    userListContainer: {
        height: '100%',
        width: '100%',
        position: 'absolute',
        right: 0,
        zIndex: 3,
        backgroundColor: 'black',
        borderWidth: 1,
        borderColor: 'white',
        padding: 10,
        rowGap: 5
    },
    chatContainer: {
        height: '100%',
        width: '100%',
        position: 'absolute',
        right: width * 3,
        zIndex: 3,
        backgroundColor: 'black',
        borderWidth: 1,
        borderColor: 'white'
    },
    userListTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        textAlign: 'center',
        margin: 7
    },
    headerChat: {
        flex: 0.1
    },
    messageChatScroll: {
        width: '100%'
    },
    messageChatScrollStyle: {
        flex: 0.75,
        width: '100%',
        paddingLeft: 10,
        paddingRight: 10
    },
    senderMessageContainer: {
        width: '100%',
        flexDirection: 'row-reverse',
        marginBottom: 5
    },
    senderMessageWrapper: {
        maxWidth: '50%',
        alignItems: 'flex-end'
    },
    senderUsername: {
        width: '100%',
        textAlign: 'right',
        color: 'white'
    },
    senderMessage: {
        color: 'black',
        backgroundColor: 'white',
        padding: 10,
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        maxWidth: '100%'
    },
    senderMessageDate: {
        textAlign: 'left',
        width: '100%',
        color: 'white'
    },
    receiverMessageContainer: {
        width: '100%',
        flexDirection: 'row',
        marginBottom: 5
    },
    receiverMessageWrapper: {
        maxWidth: '50%'
    },
    receiverUsername: {
        width: '100%',
        textAlign: 'left',
        color: 'white'
    },
    receiverMessage: {
        color: 'black',
        backgroundColor: 'white',
        padding: 10,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        borderTopRightRadius: 10,
        maxWidth: '100%'
    },
    receiverMessageDate: {
        textAlign: 'right',
        width: '100%',
        color: 'white'
    },
    footerChat: {
        flex: 0.15,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    chatInput: {
        height: 40,
        margin: 12,
        borderColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        padding: 10,
        width: 200,
        color: 'white'
    },
    chatTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 10,
        textAlign: 'center',
        margin: 7
    },
    loadingContainer: {
        position: 'absolute',
        flex: 1,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    }
});
