// src/screens/VaultScreen.js
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useApp } from '../context/AppContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function VaultScreen() {
  const { vault, removeFromVault } = useApp();

  const openVaultFile = async (item) => {
    try {
      const localUri = FileSystem.documentDirectory + item.name;
      await FileSystem.writeAsStringAsync(localUri, item.url, { encoding: FileSystem.EncodingType.UTF8 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(localUri);
      } else {
        Alert.alert('Saved', 'Vault entry is available offline.');
      }
    } catch (err) {
      Alert.alert('Error', 'Unable to open vault file.');
    }
  };

  if (!vault.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Vault is empty</Text>
        <Text style={styles.emptyCaption}>Download files from subject pages to store them here.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vault}
        keyExtractor={(item, index) => `${item.url}-${index}`}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.type || 'Stored'} • {item.size || 'Unknown'}</Text>
            </View>
            <View style={styles.row}> 
              <TouchableOpacity style={styles.openBtn} onPress={() => openVaultFile(item)}>
                <Text style={styles.btnText}>Open</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.delBtn} onPress={() => removeFromVault(index)}>
                <Text style={styles.delText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20 },
  emptyTitle: { fontSize: 22, fontWeight: '900', color: '#0f172a' },
  emptyCaption: { color: '#64748b', marginTop: 6, textAlign: 'center', maxWidth: 300 },

  card: { backgroundColor: '#ffffff', marginBottom: 12, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  name: { fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  meta: { fontSize: 11, color: '#94a3b8' },
  row: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  openBtn: { backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12 },
  delBtn: { borderColor: '#cbd5e1', borderWidth: 1, borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12 },
  btnText: { color: '#fff', fontWeight: '700' },
  delText: { color: '#111827', fontWeight: '700' },
});