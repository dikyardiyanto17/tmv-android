import { useEffect, useState } from 'react';
import { Button, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { registerGlobals, mediaDevices, RTCView, MediaStream } from 'react-native-webrtc';
import Video from './Video/Video';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { StackActions, useRoute, NavigationAction } from '@react-navigation/native';
import socketIO from 'socket.io-client';
import * as mediasoupClient from 'mediasoup-client';
import { encodingVP8, encodingsVP9, params, audioParameters } from '../../config/mediasoup';
import { socket } from '../../socket';

registerGlobals();

export default function Room({ navigation }) {
    const route = useRoute();
    const { data } = route.params;
    const { id } = data;
    const [myStream, setMyStream] = useState(null);
    const [allStreams, setAllStreams] = useState([]);
    const [socketIds, setSocketIds] = useState(undefined);
    const [temporaryProducerClosedData, setTemporaryProducerClosedData] = useState(null);
    const [micCondition, setMicCondition] = useState(true);
    const [cameraCondition, setCameraCondition] = useState(true);
    const [audioProducerId, setAudioProducerId] = useState('');
    const [videoProducerId, setVideoProducerId] = useState('');
    const [producerTransport, setProducerTransport] = useState(null);
    const [audioProducer, setAudioProducer] = useState(null);
    const [videoProducer, setVideoProducer] = useState(null);
    const [videoParam, setVideoParam] = useState({
        ...params,
        appData: {
            label: 'video',
            isActive: true,
            isMicActive: true,
            isVideoActive: true,
            picture: null
        }
    });
    const [audioParam, setAudioParam] = useState({
        ...audioParameters,
        appData: {
            label: 'audio',
            isActive: true,
            isMicActive: true,
            isVideoActive: true,
            picture: null
        }
    });
    const changeMic = ({ status }) => {
        allStreams.forEach(data => {
            if (data.socketId != socket.id) {
                socket.emit('mic-config', { sendTo: data.socketId, isMicActive: status, id: socket.id });
            }
        });
    };

    const micButtonEvent = () => {
        setMicCondition(prevState => {
            setMyStream(prevStream => {
                if (!prevState) {
                    prevStream.getAudioTracks()[0].enabled = true;

                    changeAppData({
                        data: { isActive: true, isMicActive: true, isVideoActive: true },
                        remoteProducerId: audioProducerId
                    });
                } else {
                    prevStream.getAudioTracks()[0].enabled = false;
                    changeAppData({
                        data: { isActive: false, isMicActive: false, isVideoActive: true },
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
        const newVideo = await mediaDevices.getUserMedia({ video: true });
        setMyStream(prevStream => {
            if (cameraCondition) {
                // socket.emit('close-producer-from-client', { id: videoProducerId });
                // videoProducer.close();
                prevStream.removeTrack(prevStream.getVideoTracks()[0]);
                return prevStream;
            } else {
                const newStream = new MediaStream([...prevStream.getTracks(), newVideo.getVideoTracks()[0]]);
                return newStream;
                // mediaDevices.getUserMedia({ video: true }).then(newStream => {
                // prevStream.addTrack(newStream.getVideoTracks()[0]);
                // parameter.videoParams.track = newStream.getVideoTracks()[0]
                // parameter.videoParams.appData.isActive = true
                // parameter.videoParams.appData.isVideoActive = true
                // isActive.add("fa-video")
                // isActive.remove("fa-video-slash")
                // parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams)
                // if (!myData.video) {
                //     myData.video = {
                //         isActive: true,
                //         producerId: parameter.videoProducer.id,
                //         transporId: parameter.producerTransport.id,
                //         consumerId: undefined,
                //     }
                // } else {
                //     myData.video.producerId = parameter.videoProducer.id
                //     myData.video.isActive = true
                // }
                // });
                return prevStream;
            }
        });
        setCameraCondition(prevState => {
            return !prevState;
        });
    };

    let parameter = {
        allUsers: [],
        audioParams: {
            ...audioParameters,
            appData: {
                label: 'audio',
                isActive: true,
                isMicActive: true,
                isVideoActive: true
            }
        },
        videoParams: {
            ...params,
            appData: {
                label: 'video',
                isActive: true,
                isMicActive: true,
                isVideoActive: true
            }
        },
        consumingTransports: [],
        consumerTransport: null,
        totalUsers: 0,
        consumerTransports: []
    };

    const getMyStream = async () => {
        try {
            parameter.totalUsers++;
            const mediaStream = await mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            let audioCondition = true;
            let videoCondition = true;
            setMyStream(mediaStream);

            let user = {
                username: parameter.username,
                socketId: parameter.socketId,
                picture: null,
                stream: mediaStream,
                audio: {
                    isActive: audioCondition,
                    track: mediaStream.getAudioTracks()[0],
                    producerId: undefined,
                    transportId: undefined,
                    consumerId: undefined
                },
                video: {
                    isActive: videoCondition,
                    track: mediaStream.getVideoTracks()[0],
                    producerId: undefined,
                    transportId: undefined,
                    consumerId: undefined
                }
            };
            parameter.audioParams.track = mediaStream.getAudioTracks()[0];
            parameter.videoParams.track = mediaStream.getVideoTracks()[0];
            parameter.allUsers = [...parameter.allUsers, user];

            parameter.audioParams.appData.isMicActive = audioCondition;
            parameter.audioParams.appData.isVideoActive = videoCondition;
            parameter.videoParams.appData.isMicActive = audioCondition;
            parameter.videoParams.appData.isVideoActive = videoCondition;

            parameter.audioParams.appData.isActive = audioCondition;
            parameter.videoParams.appData.isActive = videoCondition;

            parameter.videoParams.appData.picture = null;
            parameter.audioParams.appData.picture = null;

            parameter.allUsers = [...parameter.allUsers, user];
            // parameter.localStream = mediaStream;
            parameter.audioParams.track = mediaStream.getAudioTracks()[0];
            setAudioParam(prevState => {
                return { ...prevState, track: mediaStream.getAudioTracks()[0] };
            });

            setVideoParam(prevState => {
                return { ...prevState, track: mediaStream.getVideoTracks()[0] };
            });
        } catch (error) {
            console.log('- Error Getting Stream : ', error);
        }
    };

    const getEncoding = () => {
        try {
            const firstVideoCodec = parameter.device.rtpCapabilities.codecs.find(c => c.kind === 'video');

            let mimeType = firstVideoCodec.mimeType.toLowerCase();
            if (mimeType.includes('vp9')) {
                parameter.videoParams.encoding = encodingsVP9;
                setVideoParam(prevState => {
                    return { ...prevState, encoding: encodingsVP9 };
                });
            } else {
                parameter.videoParams.encoding = encodingVP8;
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
            parameter.device = new mediasoupClient.Device();
            await parameter.device.load({
                routerRtpCapabilities: parameter.rtpCapabilities
            });
            getEncoding();
            await createSendTransport();
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
                    roomName: parameter.roomName
                },
                ({ params }) => {
                    parameter.producerTransport = parameter.device.createSendTransport(params);
                    parameter.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                        try {
                            await socket.emit('transport-connect', {
                                dtlsParameters
                            });

                            callback();
                        } catch (error) {
                            errback('- Error Connecting Transport : ', error);
                        }
                    });

                    parameter.producerTransport.on('produce', async (parameters, callback, errback) => {
                        try {
                            await socket.emit(
                                'transport-produce',
                                {
                                    kind: parameters.kind,
                                    rtpParameters: parameters.rtpParameters,
                                    appData: parameters.appData,
                                    roomName: parameter.roomName
                                },
                                ({ id, producersExist, kind }) => {
                                    callback({
                                        id
                                    });
                                    if (producersExist && kind == 'audio') getProducers();
                                    // if (!producersExist) addMuteAllButton({ parameter, socket })
                                }
                            );
                        } catch (error) {
                            errback(error);
                        }
                    });

                    parameter.producerTransport.on('connectionstatechange', async e => {
                        try {
                            console.log('- State Change Producer : ', e);
                            if (e == 'failed') {
                                // socket.close()
                                // window.location.reload()
                            }
                        } catch (error) {
                            console.log('- Error Connecting State Change Producer : ', error);
                        }
                    });

                    setProducerTransport(parameter.producerTransport);

                    socket.emit(
                        'create-webrtc-transport',
                        {
                            consumer: true,
                            roomName: parameter.roomName
                        },
                        ({ params }) => {
                            parameter.consumerTransport = parameter.device.createRecvTransport(params);

                            parameter.consumerTransport.on('connectionstatechange', async e => {
                                console.log('- Receiver Transport State : ', e);
                            });

                            parameter.consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
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
                        }
                    );
                    connectSendTransport();
                }
            );
        } catch (error) {
            console.log('- Error Creating Send Transport : ', error);
        }
    };

    const connectSendTransport = async () => {
        try {
            // Producing Audio And Video Transport
            let myData = parameter.allUsers.find(data => data.socketId == parameter.socketId);

            parameter.audioProducer = await parameter.producerTransport.produce(parameter.audioParams);
            parameter.videoProducer = await parameter.producerTransport.produce(parameter.videoParams);
            await parameter.videoProducer.setMaxSpatialLayer(1);
            // console.log("- Producer : ", parameter.videoProducer)
            myData.video.producerId = parameter.videoProducer.id;
            myData.video.transportId = parameter.producerTransport.id;
            // parameter.videoProducer.setMaxIncomingBitrate(900000)
            parameter.videoProducer.on('trackended', () => {
                // window.location.reload();
                console.log('video track ended');
            });

            parameter.videoProducer.on('transportclose', () => {
                // window.location.reload();
                console.log('video transport ended');
            });

            myData.audio.producerId = parameter.audioProducer.id;
            myData.audio.transportId = parameter.producerTransport.id;

            setAudioProducerId(parameter.audioProducer.id);
            setVideoProducerId(parameter.videoProducer.id);

            parameter.audioProducer.on('trackended', () => {
                console.log('audio track ended');
            });

            parameter.audioProducer.on('transportclose', () => {
                console.log('audio transport ended');
            });
            setVideoProducer(parameter.videoProducer);
            setAudioProducer(parameter.audioProducer);
        } catch (error) {
            console.log('- Error Connecting Transport Producer : ', error);
        }
    };

    const getProducers = () => {
        try {
            socket.emit('get-producers', { roomName: parameter.roomName }, producerList => {
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
            if (parameter.consumingTransports.includes(remoteProducerId)) return;
            parameter.consumingTransports.push(remoteProducerId);
            let totalReconnecting = 0;
            const connectingRecvTransport = async () => {
                if (!parameter.consumerTransport) {
                    totalReconnecting++;
                    setTimeout(() => {
                        connectingRecvTransport();
                    }, 1000);
                } else if (totalReconnecting >= 20) {
                    console.log('Receiver Transport Wont Connected');
                } else {
                    await connectRecvTransport({
                        consumerTransport: parameter.consumerTransport,
                        remoteProducerId,
                        serverConsumerTransportId: parameter.consumerTransport.id
                    });
                }
            };

            await connectingRecvTransport();
        } catch (error) {
            console.log('- Error Signaling New Consumer Transport : ', error);
        }
    };

    const connectRecvTransport = async ({ consumerTransport, remoteProducerId, serverConsumerTransportId }) => {
        try {
            console.log(parameter);
            await socket.emit(
                'consume',
                {
                    rtpCapabilities: parameter.device.rtpCapabilities,
                    remoteProducerId,
                    serverConsumerTransportId,
                    roomName: parameter.roomName
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
                        let isUserExist = parameter.allUsers.find(data => data.socketId == params.producerSocketOwner);
                        const { track } = consumer;

                        if (!params?.appData?.isActive) {
                            track.enabled = false;
                        }

                        if (isUserExist) {
                            isUserExist[params.appData.label] = {
                                track,
                                isActive: params?.appData?.isActive,
                                consumserId: consumer.id,
                                producerId: remoteProducerId,
                                transportId: consumerTransport.id
                            };
                        } else {
                            parameter.totalUsers++;
                            let data = {
                                username: params.username,
                                socketId: params.producerSocketOwner,
                                picture: params.appData.picture,
                                stream: new MediaStream()
                            };
                            data[params.appData.label] = {
                                track,
                                isActive: params.appData.isActive,
                                consumserId: consumer.id,
                                producerId: remoteProducerId,
                                transportId: consumerTransport.id
                            };
                            parameter.allUsers = [...parameter.allUsers, data];
                        }
                        // if (params.kind == 'audio' && params.appData.label == 'audio') {
                        //     // console.log('>>>>>>', allStreams);
                        //     // Do Something
                        //     theStream.audio.producerId = remoteProducerId;
                        //     theStream.stream.addTrack(track);
                        //     // parameter.allUsers.forEach(data => {
                        //     //     if (data.socketId === params.producerSocketOwner) {
                        //     //         data.stream.addTrack(track);
                        //     //     }
                        //     // });
                        //     // const newStream = new MediaStream(remoteStream)
                        //     // newStream.addTrack(track)
                        //     // setRemoteStream(newStream)
                        // }
                        // if (params.kind == 'video' && params.appData.label == 'video') {
                        //     // Do Something
                        //     theStream.stream.addTrack(track);
                        //     theStream.video.producerId = remoteProducerId;
                        //     // parameter.allUsers.forEach(data => {
                        //     //     if (data.socketId === params.producerSocketOwner) {
                        //     //         data.stream.addTrack(track);
                        //     //     }
                        //     // });
                        //     // const newStream = new MediaStream(remoteStream)
                        //     // newStream.addTrack(track)
                        //     // setRemoteStream(newStream)
                        // }

                        if (params.appData.label == 'screensharing') {
                            // Do Something
                        }
                        if (params.kind == 'audio' && params.appData.label == 'screensharingaudio') {
                            // Do Something
                        }

                        // if (parameter.record.isRecording && params.kind == 'audio') {
                        //     // Do Something
                        //     const audioSource = parameter.record.audioContext.createMediaStreamSource(new MediaStream([track]));
                        //     audioSource.connect(parameter.record.audioDestination);
                        // }

                        // if (parameter.isScreenSharing.isScreenSharing) {
                        //     // Do Something
                        // }

                        parameter.consumerTransports = [
                            ...parameter.consumerTransports,
                            {
                                consumer,
                                consumerTransport,
                                serverConsumerTransportId: params.id,
                                producerId: remoteProducerId
                            }
                        ];

                        socket.emit('consumer-resume', {
                            serverConsumerId: params.serverConsumerId
                        });
                        setAllStreams(prevState => {
                            let newData = [...prevState];
                            const isExist = newData.find(data => data.socketId == params.producerSocketOwner);
                            let theStream = {
                                socketId: params.producerSocketOwner,
                                stream: new MediaStream(),
                                audio: { producerId: undefined, consumerId: undefined },
                                video: { producerId: undefined, consumerId: undefined }
                            };
                            if (isExist) {
                                theStream = isExist;
                            }
                            if (params.kind == 'audio' && params.appData.label == 'audio') {
                                theStream.audio.producerId = remoteProducerId;
                                theStream.stream.addTrack(track);
                            }
                            if (params.kind == 'video' && params.appData.label == 'video') {
                                theStream.stream.addTrack(track);
                                theStream.video.producerId = remoteProducerId;
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

    useEffect(() => {
        parameter.socketId = socket.id;
    }, []);

    useEffect(() => {
        getMyStream();
        console.log('- Socket : ', socket.connected, ' - Id : ', socket.id);
        function onConnect({ socketId }) {
            setSocketIds(socketId);
            parameter.username = 'Diky';
            parameter.roomName = id;
            socket.emit('joinRoom', { roomName: id, username: parameter.username }, data => {
                parameter.rtpCapabilities = data.rtpCapabilities;
                parameter.rtpCapabilities.headerExtensions = data.rtpCapabilities.headerExtensions.filter(
                    ext => ext.uri !== 'urn:3gpp:video-orientation'
                );
                createDevice();
            });
        }

        const newProducer = ({ producerId, socketId }) => {
            signalNewConsumerTransport({ remoteProducerId: producerId, socket, parameter, socketId });
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

                    console.log(kind);

                    if (kind === 'audio' && checkData) {
                        updateData = newData.filter(data => data.socketId != socketId);
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

        socket.on('connection-success', onConnect);

        socket.on('new-producer', newProducer);

        socket.on('producer-closed', removeProducer);

        return () => {
            socket.off('connection-success', onConnect);
            socket.off('new-producer', newProducer);
            socket.off('producer-closed', removeProducer);
        };
    }, [socket]);

    return (
        <ScrollView contentContainerStyle={styles.topContainer}>
            <Text>Room {id}</Text>
            {myStream && cameraCondition && (
                <View style={styles.container}>
                    <Video stream={myStream} />
                </View>
            )}

            {allStreams &&
                allStreams.map(data => {
                    if (data.audio.producerId && data.video.producerId) {
                        return (
                            <View key={data.socketId} style={styles.container}>
                                <Video stream={data.stream} />
                            </View>
                        );
                    }
                })}
            <View style={styles.buttonContainer}>
                <Pressable style={[styles.button, { backgroundColor: micCondition ? 'grey' : 'green' }]} onPress={micButtonEvent}>
                    <Icon name={micCondition ? 'microphone' : 'microphone-slash'} size={20} color="white" light />
                </Pressable>
                <Pressable style={[styles.button, { backgroundColor: cameraCondition ? 'grey' : 'green' }]} onPress={cameraButtonEvent}>
                    <Icon name={cameraCondition ? 'video' : 'video-slash'} size={20} color="white" light />
                </Pressable>
            </View>
        </ScrollView>
    );
}
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    topContainer: {
        flex: 1,
        backgroundColor: 'green'
    },
    videoContainer: {
        width: width,
        aspectRatio: 1
    },
    container: {
        flex: 1,
        backgroundColor: 'red'
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 100,
        backgroundColor: 'black'
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
    }
});
