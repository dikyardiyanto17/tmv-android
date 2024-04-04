import { Image, StyleSheet, View } from 'react-native';
import unknownImage from '../../../assets/pictures/unknown.jpg';

export default function VideoOff({ imgUser }) {
    const imageFilter = ({ imgSource }) => {
        try {
            if (imgSource === '/assets/pictures/unknown.jpg' || !imgSource) {
                return unknownImage;
            } else {
                return { uri: imgSource };
            }
        } catch (error) {
            console.log('- Error Filtering Image : ', error);
        }
    };
    return (
        <View style={styles.profilePictureContainer}>
            <Image source={imageFilter({ imgSource: imgUser })} style={styles.profilePicture} />
        </View>
    );
}

const styles = StyleSheet.create({
    profilePictureContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: '50%',
        aspectRatio: 1
    },
    profilePicture: {
        width: '100%',
        height: '100%',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'white'
    }
});
