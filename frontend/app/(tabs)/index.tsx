import React, { useState } from 'react';
import { Text, TextInput, View, Button, StyleSheet } from 'react-native';
import axios from 'axios';

export default function Index() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');

  const sendMessage = async () => {
    try {
      const res = await axios.post('https://solid-space-tribble-v66v5x5wq9jwf7g9-8000.app.github.dev/echo', { message });
      setResponse(res.data.response);
    } catch (err) {
      console.error(err);
      setResponse('Error connecting to backend');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>AI MVP</Text>
      <TextInput
        style={styles.input}
        placeholder="Type something..."
        onChangeText={setMessage}
        value={message}
      />
      <Button title="Send to AI" onPress={sendMessage} />
      <Text style={styles.response}>{response}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 100 },
  heading: { fontSize: 24, marginBottom: 20 },
  input: { borderWidth: 1, padding: 10, marginBottom: 10 },
  response: { marginTop: 20, fontSize: 18 },
});
