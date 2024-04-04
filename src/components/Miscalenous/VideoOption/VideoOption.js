import {useEffect, useState} from 'react';
import RNPickerSelect from 'react-native-picker-select';
export default function VideoOption({videoDevices, changeDevice}) {
  return (
    <RNPickerSelect
      placeholder={{label: 'Select Camera', value: ''}}
      onValueChange={value => {
        changeDevice({videoId: value, audioId: false});
      }}
      items={videoDevices}
    />
  );
}
