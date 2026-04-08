// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { apiFetchSubjects, apiCreateSubject, apiEditSubject, apiDeleteSubject } from '../api';

const BRANCHES = ['All', 'CS & IT', 'Electrical', 'Electronics', 'Mechanical', 'Civil'];

const initialForm = { _id: '', name: '', branch: 'CS & IT', description: '' };

export default function HomeScreen({ navigation }) {
  const {
    branch,
    setBranch,
    subjects,
    setSubjects,
    user,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(initialForm);

  useEffect(() => { fetchSubjects(); }, [branch]);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const all = await apiFetchSubjects(branch);
      setSubjects(all);
    } catch (e) {
      Alert.alert('Error', 'Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = subjects
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter(s => (branch === 'All' ? s.isMain : true));

  const openCreate = () => {
    setForm(initialForm);
    setEditMode(false);
    setModalVisible(true);
  };

  const openEdit = (subject) => {
    setForm({
      _id: subject._id,
      name: subject.name,
      branch: subject.branch,
      description: subject.description || '',
    });
    setEditMode(true);
    setModalVisible(true);
  };

  const submitSubject = async () => {
    if (!form._id.trim() || !form.name.trim()) {
      Alert.alert('Fill required fields', 'Subject ID and name are required.');
      return;
    }

    try {
      if (editMode) {
        await apiEditSubject(form._id, {
          name: form.name,
          branch: form.branch,
          description: form.description,
        });
      } else {
        await apiCreateSubject(form);
      }
      await fetchSubjects();
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not save subject');
    }
  };

  const removeSubject = async (subjectId) => {
    Alert.alert('Confirm delete', 'Delete this hub?', [
      { text: 'No' },
      {
        text: 'Yes',
        onPress: async () => {
          try {
            await apiDeleteSubject(subjectId);
            await fetchSubjects();
          } catch (err) {
            Alert.alert('Error', err.message || 'Could not delete subject.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>GATE<Text style={styles.logoAccent}>HUB</Text></Text>
          <Text style={styles.subtitle}>Engineering resources for every stream</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Auth')} style={styles.avatarButton}>
          <Text style={styles.avatarText}>{user ? user.name[0].toUpperCase() : 'A'}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search engineering hubs..."
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {BRANCHES.map(b => (
          <TouchableOpacity
            key={b}
            style={[styles.chip, branch === b && styles.chipActive]}
            onPress={() => setBranch(b)}
          >
            <Text style={[styles.chipText, branch === b && styles.chipTextActive]}>{b}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {user?.role === 'admin' && (
        <View style={styles.adminPanel}>
          <Text style={styles.adminText}>Admin control panel</Text>
          <TouchableOpacity style={styles.adminBtn} onPress={openCreate}>
            <Text style={styles.adminBtnText}>Create Subject</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item._id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.subjectCard}>
              <TouchableOpacity
                style={styles.cardBody}
                onPress={() => navigation.navigate('Files', { subject: item })}
              >
                <Text style={styles.cardBranch}>{item.branch}</Text>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              </TouchableOpacity>

              {user?.role === 'admin' && (
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeSubject(item._id)} style={[styles.actionBtn, styles.deleteBtn]}>
                    <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editMode ? 'Edit Subject' : 'Create Subject'}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Subject ID (e.g. em_1)"
              value={form._id}
              onChangeText={(value) => setForm({ ...form, _id: value })}
              editable={!editMode}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Subject name"
              value={form.name}
              onChangeText={(value) => setForm({ ...form, name: value })}
            />
            <TextInput
              style={[styles.modalInput, { height: 80 }]}
              placeholder="Description"
              value={form.description}
              onChangeText={(value) => setForm({ ...form, description: value })}
              multiline
            />

            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalButton, styles.modalCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.modalSave]} onPress={submitSubject}>
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>{editMode ? 'Update' : 'Create'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 50 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 10 },
  logo: { fontSize: 24, fontWeight: '900', color: '#0f172a' },
  logoAccent: { color: '#6366f1' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 4 },
  avatarButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  searchInput: { marginHorizontal: 18, backgroundColor: '#ffffff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#e2e8f0', color: '#0f172a', marginBottom: 10 },

  chipRow: { paddingLeft: 18, marginBottom: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: '#cbd5e1', marginRight: 10, backgroundColor: '#ffffff' },
  chipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  chipText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#ffffff' },

  adminPanel: { marginHorizontal: 18, marginBottom: 12, padding: 12, borderRadius: 14, backgroundColor: '#eef2ff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminText: { color: '#3730a3', fontWeight: '700' },
  adminBtn: { backgroundColor: '#4f46e5', borderRadius: 12, paddingVertical: 7, paddingHorizontal: 12 },
  adminBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  list: { paddingHorizontal: 14, paddingBottom: 16 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 10 },

  subjectCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', padding: 12 },
  cardBody: {},
  cardBranch: { fontSize: 9, fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', marginBottom: 4 },
  cardName: { fontSize: 15, fontWeight: '900', color: '#0f172a', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#64748b', lineHeight: 17 },

  cardActions: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  actionBtn: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  deleteBtn: { borderColor: '#fecaca' },
  actionText: { color: '#334155', fontSize: 10, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.52)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', marginBottom: 14 },
  modalInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10, fontSize: 14 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalButton: { borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, marginLeft: 8 },
  modalCancel: { borderWidth: 1, borderColor: '#cbd5e1' },
  modalSave: { backgroundColor: '#4f46e5' },
  modalButtonText: { color: '#0f172a', fontWeight: '700' },
});