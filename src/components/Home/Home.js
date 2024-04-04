import { ScrollView, View, Text, StyleSheet, ImageBackground, Dimensions, TextInput, Button, Alert, AppRegistry } from 'react-native';
import notifee, { AndroidImportance, EventType } from '@notifee/react-native';

import BackgroundImage from '../../assets/pictures/HomeBackground.jpg';
import LottieView from 'lottie-react-native';
import HomeGif from '../../assets/pictures/HomeGif.json';
import { useEffect, useRef, useState } from 'react';
// import Test from '../../assets/pictures/unknonwn.jpg';
const { width } = Dimensions.get('window');

export default function Home({ navigation }) {
    const [text, onChangeText] = useState('');
    const animationRef = useRef(null);
    const joinRoomButton = async () => {
        try {
            if (!text) {
                Alert.alert('Invalid Room', 'Room ID is empty');
                return;
            }
            navigation.navigate('Lobby', { id: text });
        } catch (error) {
            console.log('- Error joining room : ', error);
        }
    };

    useEffect(() => {
        animationRef.current?.play();
    }, []);
    return (
        <ImageBackground source={BackgroundImage} style={style.backgroundImage}>
            <ScrollView contentContainerStyle={style.topContainer}>
                <View style={style.container}>
                    <Text style={style.title}>Tatap Muka Virtual</Text>
                    <LottieView style={style.backgroundGif} source={HomeGif} autoPlay loop ref={animationRef} />
                    <TextInput style={style.input} onChangeText={onChangeText} value={text} placeholder="Room Id..." />
                    <Button title="Join Room" color="blue" onPress={joinRoomButton} />
                </View>
            </ScrollView>
        </ImageBackground>
    );
}

const style = StyleSheet.create({
    topContainer: {
        flex: 1
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    backgroundImage: {
        width: '100%',
        height: '100%'
    },
    backgroundGif: {
        width: width,
        aspectRatio: 1
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center'
    },
    input: {
        height: 40,
        margin: 12,
        borderColor: 'white',
        borderRadius: 5,
        borderWidth: 1,
        padding: 10,
        width: 200
    }
});
