class VoiceAssistant {
            constructor() {
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.sphere = null;
                this.sphereLight = null;
                this.animationId = null;
                
                this.apiKey = localStorage.getItem('mistral_api_key') || '';
                this.selectedModel = localStorage.getItem('mistral_model') || 'mistral-small';
                this.voiceRate = parseFloat(localStorage.getItem('voice_rate')) || 1;
                this.voicePitch = parseFloat(localStorage.getItem('voice_pitch')) || 1;
                
                this.conversationHistory = [];
                this.isSpeaking = false;
                this.isListening = false;
                this.isThinking = false;
                
                this.recognition = null;
                this.synthesis = window.speechSynthesis;
                this.currentUtterance = null;
                
                this.init();
                this.setupEventListeners();
                this.loadSettings();
            }
            
            init() {
                this.initThreeJS();
                this.createSphere();
                this.setupLighting();
                this.animate();
                this.updateStatus('idle', 'Listo para conversar');
            }
            
            initThreeJS() {
                const container = document.getElementById('canvas-container');
                
                // Escena
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x0a0a0a);
                
                // Cámara
                this.camera = new THREE.PerspectiveCamera(
                    75,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                );
                this.camera.position.z = 5;
                
                // Renderer
                this.renderer = new THREE.WebGLRenderer({ antialias: true });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                container.appendChild(this.renderer.domElement);
                
                // Resize handler
                window.addEventListener('resize', () => {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                });
            }
            
            createSphere() {
                // Geometría de la esfera
                const geometry = new THREE.SphereGeometry(1, 32, 32);
                
                // Material con propiedades especiales
                const material = new THREE.MeshPhongMaterial({
                    color: 0x6c5ce7,
                    emissive: 0x000000,
                    shininess: 100,
                    specular: 0x111111,
                    transparent: true,
                    opacity: 0.9
                });
                
                this.sphere = new THREE.Mesh(geometry, material);
                this.sphere.castShadow = true;
                this.sphere.receiveShadow = true;
                this.scene.add(this.sphere);
                
                // Agregar partículas alrededor de la esfera
                this.createParticles();
            }
            
            createParticles() {
                const particleCount = 100;
                const particles = new THREE.BufferGeometry();
                const positions = new Float32Array(particleCount * 3);
                
                for (let i = 0; i < particleCount * 3; i += 3) {
                    positions[i] = (Math.random() - 0.5) * 10;
                    positions[i + 1] = (Math.random() - 0.5) * 10;
                    positions[i + 2] = (Math.random() - 0.5) * 10;
                }
                
                particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                
                const particleMaterial = new THREE.PointsMaterial({
                    color: 0xa29bfe,
                    size: 0.02,
                    transparent: true,
                    opacity: 0.6
                });
                
                this.particles = new THREE.Points(particles, particleMaterial);
                this.scene.add(this.particles);
            }
            
            setupLighting() {
                // Luz ambiental
                const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
                this.scene.add(ambientLight);
                
                // Luz direccional
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
                directionalLight.position.set(1, 1, 1);
                directionalLight.castShadow = true;
                this.scene.add(directionalLight);
                
                // Luz de la esfera (para efectos de habla)
                this.sphereLight = new THREE.PointLight(0x6c5ce7, 0, 10);
                this.sphereLight.position.set(0, 0, 0);
                this.scene.add(this.sphereLight);
            }
            
            animate() {
                this.animationId = requestAnimationFrame(() => this.animate());
                
                // Rotación suave de la esfera
                if (this.sphere) {
                    this.sphere.rotation.y += 0.005;
                    this.sphere.rotation.x += 0.002;
                }
                
                // Animación de partículas
                if (this.particles) {
                    this.particles.rotation.y += 0.001;
                }
                
                // Efectos basados en el estado
                if (this.isSpeaking) {
                    this.animateSpeaking();
                } else if (this.isThinking) {
                    this.animateThinking();
                } else if (this.isListening) {
                    this.animateListening();
                } else {
                    this.animateIdle();
                }
                
                this.renderer.render(this.scene, this.camera);
            }
            
            animateSpeaking() {
                const time = Date.now() * 0.01;
                
                // Pulsación rápida de la esfera
                const pulse = Math.sin(time * 2) * 0.3 + 1;
                this.sphere.scale.setScalar(pulse);
                
                // Cambio de color e intensidad de luz
                const intensity = Math.sin(time * 3) * 0.5 + 1;
                this.sphereLight.intensity = intensity;
                this.sphere.material.emissive.setHex(0x6c5ce7);
                this.sphere.material.emissiveIntensity = intensity * 0.3;
                
                // Color dinámico
                const hue = (Math.sin(time * 0.1) + 1) * 0.5;
                this.sphere.material.color.setHSL(0.7 + hue * 0.2, 0.8, 0.6);
            }
            
            animateThinking() {
                const time = Date.now() * 0.005;
                
                // Pulsación lenta
                const pulse = Math.sin(time) * 0.1 + 1;
                this.sphere.scale.setScalar(pulse);
                
                // Luz naranja suave
                this.sphereLight.intensity = 0.3;
                this.sphere.material.emissive.setHex(0xf39c12);
                this.sphere.material.emissiveIntensity = 0.2;
                this.sphere.material.color.setHex(0xf39c12);
            }
            
            animateListening() {
                const time = Date.now() * 0.003;
                
                // Pulsación muy suave
                const pulse = Math.sin(time) * 0.05 + 1;
                this.sphere.scale.setScalar(pulse);
                
                // Luz verde suave
                this.sphereLight.intensity = 0.2;
                this.sphere.material.emissive.setHex(0x2ecc71);
                this.sphere.material.emissiveIntensity = 0.1;
                this.sphere.material.color.setHex(0x2ecc71);
            }
            
            animateIdle() {
                const time = Date.now() * 0.001;
                
                // Pulsación muy suave
                const pulse = Math.sin(time) * 0.02 + 1;
                this.sphere.scale.setScalar(pulse);
                
                // Color original
                this.sphereLight.intensity = 0;
                this.sphere.material.emissive.setHex(0x000000);
                this.sphere.material.emissiveIntensity = 0;
                this.sphere.material.color.setHex(0x6c5ce7);
            }
            
            setupEventListeners() {
                // Input de chat
                const chatInput = document.getElementById('chatInput');
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        this.sendMessage();
                    }
                });
                
                // Botones de control
                document.getElementById('micBtn').addEventListener('click', () => {
                    this.toggleSpeechRecognition();
                });
                
                document.getElementById('stopBtn').addEventListener('click', () => {
                    this.stopSpeaking();
                });
                
                document.getElementById('clearBtn').addEventListener('click', () => {
                    this.clearConversation();
                });
                
                // Panel de configuración
                document.getElementById('settingsToggle').addEventListener('click', () => {
                    this.toggleSettings();
                });
                
                // Configuración de API
                document.getElementById('apiKey').addEventListener('change', (e) => {
                    this.saveApiKey(e.target.value);
                });
                
                document.getElementById('modelSelect').addEventListener('change', (e) => {
                    this.selectedModel = e.target.value;
                    localStorage.setItem('mistral_model', this.selectedModel);
                });
                
                document.getElementById('voiceRate').addEventListener('input', (e) => {
                    this.voiceRate = parseFloat(e.target.value);
                    localStorage.setItem('voice_rate', this.voiceRate);
                });
                
                document.getElementById('voicePitch').addEventListener('input', (e) => {
                    this.voicePitch = parseFloat(e.target.value);
                    localStorage.setItem('voice_pitch', this.voicePitch);
                });
                
                // Configurar reconocimiento de voz
                this.setupSpeechRecognition();
            }
            
            loadSettings() {
                document.getElementById('apiKey').value = this.apiKey;
                document.getElementById('modelSelect').value = this.selectedModel;
                document.getElementById('voiceRate').value = this.voiceRate;
                document.getElementById('voicePitch').value = this.voicePitch;
                
                this.updateApiStatus();
            }
            
            saveApiKey(key) {
                this.apiKey = key.trim();
                if (this.apiKey) {
                    localStorage.setItem('mistral_api_key', this.apiKey);
                } else {
                    localStorage.removeItem('mistral_api_key');
                }
                this.updateApiStatus();
            }
            
            updateApiStatus() {
                const status = document.getElementById('apiStatus');
                if (this.apiKey) {
                    status.textContent = 'API configurada correctamente';
                    status.className = 'api-status api-active';
                } else {
                    status.textContent = 'Sin API configurada - Usando respuestas locales';
                    status.className = 'api-status api-inactive';
                }
            }
            
            toggleSettings() {
                const panel = document.getElementById('settingsPanel');
                panel.classList.toggle('active');
            }
            
            async sendMessage() {
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                
                if (!message) return;
                
                input.value = '';
                this.updateStatus('thinking', 'Procesando tu mensaje...');
                
                try {
                    const response = await this.getResponse(message);
                    this.speak(response);
                } catch (error) {
                    console.error('Error:', error);
                    this.speak('Lo siento, ha ocurrido un error. Por favor, inténtalo de nuevo.');
                }
            }
            
            async getResponse(message) {
                // Agregar al historial
                this.conversationHistory.push({
                    role: 'user',
                    content: message
                });
                
                if (!this.apiKey) {
                    return this.getFallbackResponse(message);
                }
                
                try {
                    const messages = [
                        {
                            role: 'system',
                            content: 'Eres un asistente de voz amigable y útil. Proporciona respuestas concisas y naturales para conversación por voz. Responde siempre en español con un tono conversacional.'
                        },
                        ...this.conversationHistory.slice(-10), // Últimos 10 mensajes
                        {
                            role: 'user',
                            content: message
                        }
                    ];
                    
                    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${this.apiKey}`
                        },
                        body: JSON.stringify({
                            model: this.selectedModel + '-latest',
                            messages: messages,
                            max_tokens: 300,
                            temperature: 0.7
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Error en la API de Mistral');
                    }
                    
                    const data = await response.json();
                    const assistantResponse = data.choices[0].message.content;
                    
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: assistantResponse
                    });
                    
                    return assistantResponse;
                } catch (error) {
                    console.error('Error de API:', error);
                    return this.getFallbackResponse(message);
                }
            }
            
            getFallbackResponse(message) {
                const lower = message.toLowerCase();
                
                const responses = {
                    'hola': ['¡Hola! ¿Cómo estás hoy?', '¡Hola! ¿En qué puedo ayudarte?', '¡Saludos! Es un placer hablar contigo.'],
                    'quien eres': ['Soy tu asistente de voz con inteligencia artificial.', 'Soy un asistente creado para ayudarte con tus consultas.'],
                    'gracias': ['¡De nada! Estoy aquí para ayudar.', 'Es un placer ayudarte.', '¡Con gusto!'],
                    'adios': ['¡Hasta luego! Que tengas un buen día.', '¡Nos vemos! Estaré aquí cuando me necesites.'],
                    'nombre': ['Me llamo Asistente IA. Puedes llamarme como prefieras.'],
                    'hora': [`La hora actual es ${new Date().toLocaleTimeString()}.`],
                    'fecha': [`Hoy es ${new Date().toLocaleDateString()}.`],
                    'default': [
                        'Esa es una pregunta interesante. Te ayudaría mejor si configuras una API key de Mistral.',
                        'Lo siento, necesito más contexto para responderte adecuadamente.',
                        'Para darte respuestas más precisas, considera configurar la API de Mistral en la configuración.'
                    ]
                };
                
                for (const [key, responseArray] of Object.entries(responses)) {
                    if (key !== 'default' && lower.includes(key)) {
                        return responseArray[Math.floor(Math.random() * responseArray.length)];
                    }
                }
                
                return responses.default[Math.floor(Math.random() * responses.default.length)];
            }
            
            speak(text) {
                this.stopSpeaking();
                
                if (!('speechSynthesis' in window)) {
                    console.error('Síntesis de voz no soportada');
                    this.updateStatus('idle', 'Síntesis de voz no disponible');
                    return;
                }
                
                this.currentUtterance = new SpeechSynthesisUtterance(text);
                this.currentUtterance.lang = 'es-ES';
                this.currentUtterance.rate = this.voiceRate;
                this.currentUtterance.pitch = this.voicePitch;
                
                // Buscar voz en español
                const voices = this.synthesis.getVoices();
                const spanishVoice = voices.find(voice => voice.lang.includes('es'));
                if (spanishVoice) {
                    this.currentUtterance.voice = spanishVoice;
                }
                
                this.currentUtterance.onstart = () => {
                    this.isSpeaking = true;
                    this.isThinking = false;
                    this.updateStatus('speaking', 'Hablando...');
                };
                
                this.currentUtterance.onend = () => {
                    this.isSpeaking = false;
                    this.updateStatus('idle', 'Listo para conversar');
                };
                
                this.currentUtterance.onerror = (e) => {
                    console.error('Error en síntesis de voz:', e);
                    this.isSpeaking = false;
                    this.updateStatus('idle', 'Error en síntesis de voz');
                };
                
                this.synthesis.speak(this.currentUtterance);
            }
            
            stopSpeaking() {
                if (this.synthesis.speaking) {
                    this.synthesis.cancel();
                }
                this.isSpeaking = false;
                this.isThinking = false;
                this.updateStatus('idle', 'Listo para conversar');
            }
            
            setupSpeechRecognition() {
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    this.recognition = new SpeechRecognition();
                    
                    this.recognition.continuous = false;
                    this.recognition.interimResults = false;
                    this.recognition.lang = 'es-ES';
                    
                    this.recognition.onstart = () => {
                        this.isListening = true;
                        this.updateStatus('listening', 'Escuchando...');
                    };
                    
                    this.recognition.onresult = (event) => {
                        const transcript = event.results[0][0].transcript;
                        document.getElementById('chatInput').value = transcript;
                        this.sendMessage();
                    };
                    
                    this.recognition.onend = () => {
                        this.isListening = false;
                        if (!this.isSpeaking && !this.isThinking) {
                            this.updateStatus('idle', 'Listo para conversar');
                        }
                    };
                    
                    this.recognition.onerror = (event) => {
                        console.error('Error en reconocimiento de voz:', event.error);
                        this.isListening = false;
                        this.updateStatus('idle', 'Error en reconocimiento de voz');
                    };
                }
            }
            
            toggleSpeechRecognition() {
                if (this.isListening) {
                    this.recognition.stop();
                } else if (this.recognition) {
                    this.recognition.start();
                } else {
                    alert('Reconocimiento de voz no disponible en este navegador');
                }
            }
            
            clearConversation() {
                this.conversationHistory = [];
                this.updateStatus('idle', 'Conversación limpiada - Listo para conversar');
            }
            
            updateStatus(state, message) {
                const statusText = document.getElementById('statusText');
                const statusIndicator = document.getElementById('statusIndicator');
                
                // Actualizar estados internos
                this.isSpeaking = state === 'speaking';
                this.isThinking = state === 'thinking';
                this.isListening = state === 'listening';
                
                // Actualizar texto del estado
                switch (state) {
                    case 'listening':
                        statusText.textContent = '🎤 Escuchando...';
                        statusText.className = 'status-text listening pulse';
                        break;
                    case 'speaking':
                        statusText.textContent = '🗣️ Hablando...';
                        statusText.className = 'status-text speaking pulse';
                        break;
                    case 'thinking':
                        statusText.textContent = '🤔 Pensando...';
                        statusText.className = 'status-text thinking pulse';
                        break;
                    default:
                        statusText.textContent = '🤖 Asistente IA';
                        statusText.className = 'status-text';
                        break;
                }
                
                statusIndicator.textContent = message;
            }
            
            // Cleanup
            destroy() {
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                }
                
                if (this.recognition) {
                    this.recognition.stop();
                }
                
                if (this.synthesis.speaking) {
                    this.synthesis.cancel();
                }
                
                // Limpiar Three.js
                if (this.renderer) {
                    this.renderer.dispose();
                }
                
                if (this.scene) {
                    this.scene.clear();
                }
            }
        }
        
        // Inicializar la aplicación cuando se carga la página
        let assistant;
        
        window.addEventListener('load', () => {
            assistant = new VoiceAssistant();
        });
        
        // Cleanup al cerrar la página
        window.addEventListener('beforeunload', () => {
            if (assistant) {
                assistant.destroy();
            }
        });
        
        // Manejar errores globales
        window.addEventListener('error', (e) => {
            console.error('Error global:', e.error);
        });
        
        // Cargar voces cuando estén disponibles
        if ('speechSynthesis' in window) {
            speechSynthesis.onvoiceschanged = () => {
                console.log('Voces cargadas:', speechSynthesis.getVoices().length);
            };
        }