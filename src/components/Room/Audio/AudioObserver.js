import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function AudioObserver({ status, transport }) {
    const [audioLevel, setAudioLevel] = useState(0);
    // setInterval(() => {
    //     transport?.getStats()?.then(stats => {
    //         stats.forEach(report => {
    //             if (report.type == 'media-source' && report.kind == 'audio' && report.totalAudioEnergy) {
    //                 // setAudioLevel(report.totalAudioEnergy);
    //                 console.log(report.totalAudioEnergy);
    //             }
    //         });
    //     });
    // }, 1000);
    // useEffect(() => {
    // }, []);
    return (
        <View style={[styles.audioContainer, { backgroundColor: status ? 'white' : 'red' }]}>
            <View style={[styles.audioIndicator]}></View>
            <Icon name={status ? 'microphone' : 'microphone-slash'} size={20} color="black" dark />
        </View>
    );
}

const styles = StyleSheet.create({
    audioContainer: {
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        width: 30,
        aspectRatio: 1,
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 3
    },
    audioIndicator: {
        maxWidth: 30,
        aspectRatio: 1,
        borderRadius: 999,
        position: 'absolute',
        backgroundColor: 'green',
        top: 7.5,
        right: 7.5
        // width: 15
    }
});
