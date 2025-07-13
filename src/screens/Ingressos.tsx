import React, { useEffect, useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  Button,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ref, get } from 'firebase/database';
import { database } from '../services/firebase';
import QRCode from 'react-native-qrcode-svg';
import { AuthContext } from '../contexts/AuthContext';

export default function Ingressos() {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [selectedEvento, setSelectedEvento] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const buscarUsuario = async () => {
      if (!user?.cpf) {
        setUserData(null);
        return;
      }
      try {
        const snap = await get(ref(database, `users/cpf/${user.cpf}`));
        if (snap.exists()) {
          setUserData(snap.val());
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        setUserData(null);
      }
    };
    buscarUsuario();
  }, [user]);

  useEffect(() => {
    if (userData && userData.ingressoscomprados) {
      carregarEventosAgrupados();
    } else {
      setEventos([]);
    }
  }, [userData]);

  const carregarEventosAgrupados = async () => {
    setLoading(true);
    const ingressos = userData.ingressoscomprados;
    const grupos: { [key: string]: any[] } = {};

    for (const codigo in ingressos) {
      const ingresso = ingressos[codigo];
      const eventid = ingresso.eventid;
      if (!grupos[eventid]) grupos[eventid] = [];
      grupos[eventid].push({ ...ingresso, codigo });
    }

    const listaEventos = [];

    for (const eventid in grupos) {
      try {
        const snapEvento = await get(ref(database, `eventos/${eventid}`));
        const eventoData = snapEvento.exists() ? snapEvento.val() : {};
        listaEventos.push({
          eventid,
          nomeevento: eventoData.nomeevento || 'Evento desconhecido',
          imageurl: eventoData.imageurl || '',
          ingressos: grupos[eventid],
          quantidadeTotal: grupos[eventid].length,
        });
      } catch (error) {
        console.error('Erro ao buscar evento:', error);
      }
    }

    setEventos(listaEventos);
    setLoading(false);
  };

  if (!user?.cpf || !userData) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.centered}>
          <Text style={styles.text}>Você precisa estar logado para ver seus ingressos.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ marginTop: 10 }}>Carregando seus ingressos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Text style={styles.title}>🎟️ Seus Eventos</Text>

      {eventos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.text}>Nenhum ingresso encontrado.</Text>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => item.eventid}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.card}
              onPress={() => setSelectedEvento(item)}
            >
              {item.imageurl ? (
                <Image source={{ uri: item.imageurl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Sem imagem</Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.nomeevento}>{item.nomeevento}</Text>
                <Text style={styles.quantidade}>Ingressos: {item.quantidadeTotal}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal ingressos do evento */}
      <Modal visible={!!selectedEvento} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedEvento?.nomeevento}</Text>

            <ScrollView style={{ marginBottom: 20 }}>
              {selectedEvento?.ingressos.map((ingresso: any) => (
                <View key={ingresso.codigo} style={styles.ingressoCard}>
                  <Text style={styles.ingressoTipo}>Tipo: {ingresso.tipo}</Text>
                  <Text style={styles.ingressoCodigo}>Código: {ingresso.codigo}</Text>
                  <View style={styles.qrcode}>
                    <QRCode value={ingresso.codigo} size={160} />
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Fechar" onPress={() => setSelectedEvento(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginVertical: 20,
    marginLeft: 10,
    color: '#6200ee',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fafafa',
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    padding: 10,
    elevation: 2,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  imagePlaceholder: {
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nomeevento: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  quantidade: {
    fontSize: 14,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  ingressoCard: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  ingressoTipo: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  ingressoCodigo: {
    marginTop: 4,
  },
  qrcode: {
    alignItems: 'center',
    marginTop: 10,
  },
  modalFooter: {
    marginTop: 10,
  },
});
