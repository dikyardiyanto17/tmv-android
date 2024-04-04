import { useIsFocused, useRoute } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { Button, Dimensions, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { MediaStream, mediaDevices, registerGlobals } from 'react-native-webrtc';
import Video from '../Room/Video/Video';
import VideoOff from '../Room/Video/VideoOff';
import AudioObserver from '../Room/Audio/AudioObserver';
import WarningModal from '../Modal/WarningModal';
registerGlobals();
export default function Lobby({ navigation }) {
    const isFocused = useIsFocused();
    const [warningDisplay, setWarningDisplay] = useState(false);
    const [warningTitle, setWarningTitle] = useState('Error');
    const [warningMessage, setWarningMessage] = useState('Something went wrong!');
    const route = useRoute();
    const { id } = route.params;
    const [myStream, setMyStream] = useState(null);
    const [cameraCondition, setCameraCondition] = useState(false);
    const [micCondition, setMicCondition] = useState(false);
    const [modalMicrophoneCondition, setModalMicrophoneCondition] = useState(false);
    const [modalCameraCondition, setModalCameraCondition] = useState(false);
    const [microphoneOptions, setMicrophoneOptions] = useState([{ label: 'Turn Off Microphone', deviceId: 'Turn Off Microphone' }]);
    const [cameraOptions, setCameraOptions] = useState([{ label: 'Turn Off Camera', deviceId: 'Turn Off Camera', facing: undefined }]);
    const [myUsername, setMyUsername] = useState('');
    const [cameraDeviceId, setCameraDeviceId] = useState(null);
    const [micLabel, setMicLabel] = useState('Turn Off Microphone');
    const [cameraLabel, setCameraLabel] = useState('Turn Off Camera');
    const getAllOption = async () => {
        try {
            const devices = await mediaDevices.enumerateDevices();

            devices.map(device => {
                if (device.kind == 'videoinput') {
                    setCameraOptions(prevState => {
                        return [...prevState, { label: device.label, deviceId: device.deviceId, facing: device.facing }];
                    });
                }
            });
        } catch (error) {
            console.log('- Error Getting All Option : ', error);
        }
    };
    const getMyVideoStream = async ({ deviceId, facing }) => {
        try {
            setModalCameraCondition(false);
            if (deviceId == 'Turn Off Camera') {
                myStream?.getVideoTracks()[0]?.stop();
                if (myStream?.getVideoTracks()[0]) {
                    myStream?.removeTrack(myStream?.getVideoTracks()[0]);
                }
                setCameraDeviceId(null);
                setCameraCondition(false);
                setCameraLabel('Turn Off Camera');
                return;
            }
            setCameraDeviceId({ deviceId: deviceId, facing: facing });
            setCameraLabel(`Camera ${deviceId}`);
            const newVideo = await mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    deviceId: deviceId
                }
            });
            setMyStream(prevState => {
                prevState?.getVideoTracks()[0]?.stop();
                if (prevState?.getVideoTracks()[0]) {
                    prevState?.removeTrack(prevState?.getVideoTracks()[0]);
                }

                const newStream = new MediaStream([...prevState?.getTracks(), newVideo?.getVideoTracks()[0]]);
                return newStream;
            });
            setCameraCondition(true);
        } catch (error) {
            console.log('- Error Getting My Video Stream : ', error);
        }
    };

    const getMyAudioStream = async ({ status }) => {
        try {
            setMicLabel(status ? 'Turn On Microphone' : 'Turn Off Microphone');
            myStream.getAudioTracks()[0].enabled = status;
            setMicCondition(status);
            setModalMicrophoneCondition(false);
        } catch (error) {
            console.log('- Error Getting My Audio Stream : ', error);
        }
    };

    const getInitialStream = async () => {
        try {
            const mediaStream = await mediaDevices.getUserMedia({
                audio: true
            });
            mediaStream.getAudioTracks()[0].enabled = false;
            setMyStream(mediaStream);
            setMicCondition(false);
        } catch (error) {
            console.log('- Error Get Initial Stream : ', error);
        }
    };

    const joinRoom = () => {
        try {
            if (!myUsername) {
                setWarningTitle('Failed Joining Room!');
                setWarningMessage('Username Cannot Be Empty!');
                setWarningDisplay(true);
                setTimeout(() => {
                    setWarningTitle('');
                    setWarningMessage('');
                    setWarningDisplay(false);
                }, 3000);
                return;
            }

            navigation.replace('Room', {
                id: id,
                username: myUsername,
                microphone: micCondition,
                cameraDeviceId: cameraDeviceId
            });
        } catch (error) {
            console.log('- Error Joining room : ', error);
        }
    };

    useEffect(() => {
        getInitialStream();
        getAllOption();
    }, []);
    return (
        <View style={styles.topContainer}>
            <Modal visible={modalCameraCondition ? true : false} transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalOptionContainer}>
                        {cameraOptions &&
                            cameraOptions.map(device => {
                                return (
                                    <TouchableOpacity
                                        key={device.deviceId}
                                        style={styles.optionContainer}
                                        onPress={() => {
                                            getMyVideoStream({ deviceId: device.deviceId, facing: device.facing });
                                        }}>
                                        <Text style={styles.optionText}>{device.label}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                    </View>
                </View>
            </Modal>
            <Modal visible={modalMicrophoneCondition ? true : false} transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalOptionContainer}>
                        <TouchableOpacity
                            style={styles.optionContainer}
                            onPress={() => {
                                getMyAudioStream({ status: false });
                            }}>
                            <Text style={styles.optionText}>Turn Off Microphone</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.optionContainer}
                            onPress={() => {
                                getMyAudioStream({ status: true });
                            }}>
                            <Text style={styles.optionText}>Turn On Microphone</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            <WarningModal display={warningDisplay} title={warningTitle} message={warningMessage} />
            <View style={styles.headerContainer}>
                <Text style={styles.title}>Lobby {id}</Text>
            </View>
            <View style={styles.middleContainer}>
                <View style={styles.videoContainer}>
                    <AudioObserver status={micCondition} />
                    {cameraCondition ? <Video user={true} stream={myStream} /> : <VideoOff />}
                </View>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.buttonSelect}
                    onPress={() => {
                        setModalMicrophoneCondition(true);
                    }}>
                    <Text style={styles.buttonText}>{micLabel}</Text>
                    <Icon name={'sort-down'} size={20} color="black" dark />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.buttonSelect}
                    onPress={() => {
                        setModalCameraCondition(true);
                    }}>
                    <Text style={styles.buttonText}>{cameraLabel}</Text>
                    <Icon name={'sort-down'} size={20} color="black" dark />
                </TouchableOpacity>
                <TextInput
                    onChangeText={text => setMyUsername(text)}
                    style={styles.inputName}
                    placeholder="Your name..."
                    placeholderTextColor={'grey'}
                />
                <Button
                    title="Join Room"
                    onPress={() => {
                        joinRoom();
                    }}
                />
            </View>
        </View>
    );
}
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
    topContainer: {
        flex: 1,
        backgroundColor: 'black'
    },
    headerContainer: {
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
    middleContainer: {
        flex: 0.55,
        justifyContent: 'center',
        alignItems: 'center'
    },
    videoContainer: {
        height: '80%',
        width: '80%',
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        borderColor: 'white',
        borderWidth: 1
    },
    buttonContainer: {
        flex: 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        rowGap: 5
    },
    buttonSelect: {
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        width: width / 2,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    buttonText: {
        color: 'black'
    },
    inputName: {
        backgroundColor: 'white',
        color: 'black',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'black',
        padding: 10,
        width: width / 2
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.25)'
    },
    modalOptionContainer: {
        padding: 20,
        borderRadius: 10,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'black',
        width: (width * 7) / 10,
        justifyContent: 'center'
    },
    optionContainer: {
        padding: 10,
        borderRadius: 10,
        borderColor: 'grey',
        borderWidth: 1,
        backgroundColor: 'white',
        width: '100%'
    },
    optionText: {
        color: 'black'
    }
});
