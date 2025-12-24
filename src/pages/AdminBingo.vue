<template>
  <q-page padding>
    <div class="row q-col-gutter-md">
      
      <div class="col-12 col-md-4">
        
        <q-card class="text-center q-mb-md">
          <q-card-section class="bg-deep-purple text-white">
            <div class="text-h1 text-weight-bold">{{ lastNumber || '--' }}</div>
            <div class="text-caption">NÚMERO SORTEADO</div>
          </q-card-section>
          
          <q-card-section class="q-gutter-md">
            <q-btn 
              push color="positive" 
              label="Sortear Próximo" 
              @click="drawNumber" 
              size="lg" 
              icon="casino" 
              class="full-width" 
              :disable="drawnNumbers.length >= 75" 
            />
            <q-btn 
              outline color="negative" 
              label="Resetar Jogo" 
              @click="resetGame" 
              class="full-width" 
            />
          </q-card-section>
          
          <q-card-section>
             <div class="text-grey-7">Total Sorteados: {{ drawnNumbers.length }}</div>
             <div class="row justify-center q-gutter-xs q-mt-sm" style="max-height: 100px; overflow-y: auto;">
                <q-badge v-for="num in drawnNumbers" :key="num" :label="num" color="grey-4" text-color="black" />
             </div>
          </q-card-section>
        </q-card>

        <q-card>
          <q-card-section>
            <div class="text-h6">Gerir Prêmios</div>
            <div class="row q-col-gutter-sm q-my-sm">
              <div class="col-6">
                <q-input v-model="newPrize" label="Nome" dense outlined />
              </div>
              <div class="col-4">
                <q-select 
                  v-model="newPrizeType" 
                  :options="prizeOptions" 
                  label="Tipo" 
                  dense outlined 
                  emit-value 
                  map-options 
                />
              </div>
              <div class="col-2">
                <q-btn icon="add" color="primary" round flat @click="addPrize" :disable="!newPrize"/>
              </div>
            </div>
            
            <q-list separator dense>
              <q-item v-for="prize in prizes" :key="prize.id">
                <q-item-section>
                  <q-item-label>{{ prize.name }}</q-item-label>
                  <q-item-label caption>
                    Requer: <q-badge :color="getPatternColor(prize.pattern)">{{ getPatternLabel(prize.pattern) }}</q-badge>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn icon="delete" flat color="negative" size="sm" @click="deletePrize(prize.id)"/>
                </q-item-section>
              </q-item>
              <q-item v-if="prizes.length === 0">
                <q-item-section class="text-grey text-center">Sem prêmios cadastrados</q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-8">
        <q-card class="full-height">
          <q-card-section class="bg-grey-2 row justify-between items-center">
            <div class="text-h6">Sala de Jogadores</div>
            <q-badge color="primary">{{ players.length }} online</q-badge>
          </q-card-section>

          <q-list separator>
            <q-item v-for="player in sortedPlayers" :key="player.id" :class="getRowClass(player)">
              
              <q-item-section avatar>
                <q-avatar :color="player.status === 'winner' ? 'yellow-9' : 'primary'" text-color="white" icon="person">
                  {{ player.status === 'winner' ? '★' : player.name.charAt(0).toUpperCase() }}
                </q-avatar>
              </q-item-section>

              <q-item-section>
                <q-item-label class="text-weight-bold text-h6">{{ player.name }}</q-item-label>
                <div class="row q-gutter-xs">
                   <q-badge v-if="hasPattern(player, 'horizontal')" color="blue">Linha</q-badge>
                   <q-badge v-if="hasPattern(player, 'diagonal')" color="orange">Diagonal</q-badge>
                   <q-badge v-if="hasPattern(player, 'full')" color="positive">FULL</q-badge>
                </div>
              </q-item-section>

              <q-item-section side>
                <div v-if="player.status === 'winner'" class="text-positive text-bold text-h6">
                  VENCEDOR!
                </div>
                <div v-else class="column items-center">
                  <span class="text-h6">{{ player.matches_count }}/24</span>
                  <small class="text-grey">pontos</small>
                </div>
              </q-item-section>

            </q-item>
            
            <q-item v-if="players.length === 0">
              <q-item-section class="text-center text-grey q-pa-xl">Nenhum jogador na sala ainda.</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from 'src/boot/supabase'
import { useQuasar } from 'quasar'

// 1. Definições Iniciais
const $q = useQuasar()
const drawnNumbers = ref([])
const lastNumber = ref(null)
const players = ref([]) // Corrigido: Variável declarada
const prizes = ref([])
const newPrize = ref('')
const newPrizeType = ref('full')

const prizeOptions = [
  { label: 'Linha Horizontal', value: 'horizontal' },
  { label: 'Diagonal', value: 'diagonal' },
  { label: 'Cartela Cheia', value: 'full' }
]

// 2. Helpers Visuais
const getPatternLabel = (val) => prizeOptions.find(o => o.value === val)?.label || val
const getPatternColor = (val) => val === 'full' ? 'purple' : (val === 'diagonal' ? 'orange' : 'blue')

const hasPattern = (p, type) => p.completed_patterns && p.completed_patterns.includes(type)

const getRowClass = (player) => {
  if (player.status === 'winner') return 'bg-yellow-1';
  if (player.matches_count >= 20) return 'bg-red-1'; // Quase batendo
  return '';
}

// 3. Ordenação Inteligente
const sortedPlayers = computed(() => {
  return [...players.value].sort((a, b) => {
    // Vencedores primeiro
    if (a.status === 'winner' && b.status !== 'winner') return -1;
    if (b.status === 'winner' && a.status !== 'winner') return 1;
    
    // Quem tem 'full' (mas não confirmou vitória ainda)
    const aFull = hasPattern(a, 'full') ? 1 : 0;
    const bFull = hasPattern(b, 'full') ? 1 : 0;
    if (aFull !== bFull) return bFull - aFull;

    // Quem tem mais pontos
    return b.matches_count - a.matches_count;
  })
})

// 4. Lógica de Jogo (Sorteio)
const drawNumber = async () => {
  if (drawnNumbers.value.length >= 75) return;
  
  let newNum;
  do { 
    newNum = Math.floor(Math.random() * 75) + 1; 
  } while (drawnNumbers.value.includes(newNum));
  
  const newDrawn = [...drawnNumbers.value, newNum];
  
  const { error } = await supabase.from('game_state').update({ 
    drawn_numbers: newDrawn, 
    last_number: newNum 
  }).eq('id', 1);

  if (!error) {
    drawnNumbers.value = newDrawn;
    lastNumber.value = newNum;
  }
}

const resetGame = () => {
  $q.dialog({
    title: 'Novo Jogo',
    message: 'Isso zerará a cartela de todos e removerá os jogadores atuais.',
    cancel: true,
    persistent: true,
    ok: { label: 'Reiniciar', color: 'negative' }
  }).onOk(async () => {
    await supabase.from('game_state').update({ drawn_numbers: [], last_number: null }).eq('id', 1);
    await supabase.from('players').delete().neq('id', 0);
    drawnNumbers.value = [];
    lastNumber.value = null;
    players.value = [];
  })
}

// 5. Lógica de Prêmios
const addPrize = async () => {
  if (!newPrize.value) return;
  await supabase.from('prizes').insert({ 
    name: newPrize.value,
    pattern: newPrizeType.value 
  });
  newPrize.value = '';
  loadPrizes();
}

const deletePrize = async (id) => {
  await supabase.from('prizes').delete().eq('id', id);
  loadPrizes();
}

const loadPrizes = async () => {
  const { data } = await supabase.from('prizes').select('*');
  prizes.value = data || [];
}

// 6. Inicialização e Realtime
onMounted(async () => {
  // Carrega Estado do Jogo
  const { data: game } = await supabase.from('game_state').select('*').single()
  if (game) {
    drawnNumbers.value = game.drawn_numbers
    lastNumber.value = game.last_number
  }
  
  // Carrega Prêmios
  loadPrizes();

  // Carrega Jogadores
  const { data: pList } = await supabase.from('players').select('*')
  players.value = pList || []

  // Monitoramento em Tempo Real (Jogadores)
  supabase.channel('admin-dashboard')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
      if (payload.eventType === 'INSERT') players.value.push(payload.new);
      if (payload.eventType === 'UPDATE') {
        const idx = players.value.findIndex(p => p.id === payload.new.id);
        if (idx !== -1) players.value[idx] = payload.new;
        
        // Notificação sonora/visual para o Admin se alguém ganhar
        if (payload.new.status === 'winner' && payload.old.status !== 'winner') {
          $q.notify({ 
            message: `JOGADOR ${payload.new.name} BINGOU!`, 
            color: 'purple', 
            icon: 'emoji_events', 
            position: 'top',
            timeout: 0, // Fica na tela até clicar
            actions: [{ label: 'OK', color: 'white' }]
          });
        }
      }
      if (payload.eventType === 'DELETE') {
        players.value = players.value.filter(p => p.id !== payload.old.id);
      }
    })
    .subscribe();
})
</script>