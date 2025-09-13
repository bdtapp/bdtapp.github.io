const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { Server } = require('ws');
const { createServer } = require('http');
const { timeStamp } = require('console');

const app = express();
const server = createServer(app);
const wss = new Server({ server });
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bostondogtor';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Pet Schema
const petSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: false
    },
    owner: {
        type: String,
        required: true,
        trim: false
    },
    age: {
        type: Number,
        required: true,
        min: 0,
        max: 30
    },
    sex: {
        type: String,
        required: true,
        enum: ['m', 'f']
    },
    fixed: {
        type: Boolean,
        required: true
    },
    active: {
        type: Boolean,
        default: false
    },
    datecreated: {
        type: Date,
        default: Date.now
    }
});

const activePetSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: false
    },
    owner: {
        type: String,
        required: true,
        trim: false
    },
    age: {
        type: Number,
        required: true
    },
    sex: {
        type: String,
        required: true,
        enum: ['m', 'f']
    },
    fixed: {
        type: Boolean,
        required: true
    },
    out: {
        type: Boolean,
        default: false
    },
    fed: {
        type: Boolean,
        default: false
    },
    currentlyOut: {
        type: Boolean,
        default: false
    },
    currentlyouttimestamp: {
        type: Date,
        default: null
    },
    cleared: {
        type: Boolean,
        default: false
    },
    dateActivated: {
        type: Date,
        default: Date.now
    },
});

const logSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: false
    },
    owner: {
        type: String,
        required: true,
        trim: false
    },
    key: {
        type: String,
        required: true,
    },
    active: {
        type: Boolean,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    count: {
        type: Number,
        required: true
    }
});

// Room Schema
const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20
    },
    emoji: {
        type: String,
        required: true,
        default: '🏠'
    },
    count: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    dateCreated: {
        type: Date,
        default: Date.now
    }
});

const Pet = mongoose.model('Pet', petSchema);
const ActivePet = mongoose.model('activepets', activePetSchema);
const Logs = mongoose.model('Logs', logSchema);
const Room = mongoose.model('Room', roomSchema);

// WebSocket connection handling
wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            console.log('Received message:', data);

            switch (data.action) {
                case 'getPets':
                    const pets = await Pet.find().sort({ datecreated: -1 });
                    ws.send(JSON.stringify({ action: 'petsData', data: pets }));
                    break;

                case 'getActivePets':
                    const activePets = await ActivePet.find().sort({ dateActivated: -1 });
                    ws.send(JSON.stringify({ action: 'activePetsData', data: activePets }));
                    break;

                case 'getInactivePets':
                    const inactivePets = await Pet.find({}).sort({ datecreated: -1 });
                    ws.send(JSON.stringify({ action: 'inactivePetsData', data: inactivePets }));
                    break;

                case 'getLogs':
                    try {
                        const logs = await Logs.find().sort({ timestamp: -1 }).limit(500);
                        ws.send(JSON.stringify({
                            action: 'logsData',
                            data: logs
                        }));
                    } catch (error) {
                        console.error('Error fetching logs:', error);
                        ws.send(JSON.stringify({
                            action: 'error',
                            message: 'Failed to fetch logs'
                        }));
                    }
                    break;

                // Room-related actions
                case 'getRooms':
                    try {
                        const rooms = await Room.find().sort({ dateCreated: 1 });
                        ws.send(JSON.stringify({
                            action: 'roomsData',
                            data: rooms
                        }));
                    } catch (error) {
                        console.error('Error fetching rooms:', error);
                        ws.send(JSON.stringify({
                            action: 'error',
                            message: 'Failed to fetch rooms'
                        }));
                    }
                    break;

                case 'createRoom':
                    try {
                        const { name, emoji } = data;

                        if (!name || !name.trim()) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room name is required'
                            }));
                            return;
                        }

                        // Check if room with same name already exists
                        const existingRoom = await Room.findOne({ 
                            name: name.trim().toLowerCase() 
                        });

                        if (existingRoom) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'A room with this name already exists'
                            }));
                            return;
                        }

                        const newRoom = new Room({
                            name: name.trim(),
                            emoji: emoji || '🏠',
                            count: 0
                        });

                        const savedRoom = await newRoom.save();

                        // Broadcast to all clients
                        broadcast(JSON.stringify({
                            action: 'roomCreated',
                            data: savedRoom
                        }));

                    } catch (error) {
                        console.error('Error creating room:', error);
                        ws.send(JSON.stringify({
                            action: 'error',
                            message: 'Failed to create room'
                        }));
                    }
                    break;

                case 'updateRoom':
                    try {
                        const { roomId, name, emoji } = data;

                        if (!roomId) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room ID is required'
                            }));
                            return;
                        }

                        const updateData = {};
                        if (name !== undefined) updateData.name = name.trim();
                        if (emoji !== undefined) updateData.emoji = emoji;

                        const updatedRoom = await Room.findByIdAndUpdate(
                            roomId,
                            updateData,
                            { new: true }
                        );

                        if (!updatedRoom) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room not found'
                            }));
                            return;
                        }

                        // Broadcast to all clients
                        broadcast(JSON.stringify({
                            action: 'roomUpdated',
                            data: updatedRoom
                        }));

                    } catch (error) {
                        console.error('Error updating room:', error);
                        ws.send(JSON.stringify({
                            action: 'error',
                            message: 'Failed to update room'
                        }));
                    }
                    break;

                case 'updateRoomCount':
                    try {
                        const { roomId, delta } = data;

                        if (!roomId || delta === undefined) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room ID and count delta are required'
                            }));
                            return;
                        }

                        const room = await Room.findById(roomId);
                        if (!room) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room not found'
                            }));
                            return;
                        }

                        const newCount = room.count + delta;

                        // Validate the change
                        if (newCount < 0) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room count cannot be negative'
                            }));
                            return;
                        }

                        // Check total room count against active pets
                        const activeCount = await Pet.countDocuments({ active: true });
                        const allRooms = await Room.find();
                        const totalRoomCount = allRooms.reduce((sum, r) => sum + r.count, 0) - room.count + newCount;

                        if (totalRoomCount > activeCount) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Total room count cannot exceed active pets count'
                            }));
                            return;
                        }

                        const updatedRoom = await Room.findByIdAndUpdate(
                            roomId,
                            { count: newCount },
                            { new: true }
                        );

                        // Broadcast to all clients
                        broadcast(JSON.stringify({
                            action: 'roomCountUpdated',
                            data: updatedRoom
                        }));

                    } catch (error) {
                        console.error('Error updating room count:', error);
                        ws.send(JSON.stringify({
                            action: 'error',
                            message: 'Failed to update room count'
                        }));
                    }
                    break;

                case 'deleteRoom':
                    try {
                        const { roomId } = data;

                        if (!roomId) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room ID is required'
                            }));
                            return;
                        }

                        const deletedRoom = await Room.findByIdAndDelete(roomId);

                        if (!deletedRoom) {
                            ws.send(JSON.stringify({
                                action: 'error',
                                message: 'Room not found'
                            }));
                            return;
                        }

                        // Broadcast to all clients
                        broadcast(JSON.stringify({
                            action: 'roomDeleted',
                            data: { _id: roomId }
                        }));

                    } catch (error) {
                        console.error('Error deleting room:', error);
                        ws.send(JSON.stringify({
                            action: 'error',
                            message: 'Failed to delete room'
                        }));
                    }
                    break;

                case 'createPet':
                    const { name, owner, age, sex, fixed } = data;

                    if (!name || !owner || age === undefined || !sex || fixed === undefined) {
                        ws.send(JSON.stringify({ action: 'error', message: 'All fields are required' }));
                        return;
                    }

                    if (age < 0 || age > 30) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Age must be between 0 and 30 years' }));
                        return;
                    }

                    if (!['m', 'f'].includes(sex)) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Sex must be "m" or "f"' }));
                        return;
                    }

                    const newPet = new Pet({
                        name: name,
                        owner: owner,
                        age: parseInt(age),
                        sex,
                        fixed: Boolean(fixed),
                        active: false
                    });

                    const savedPet = await newPet.save();

                    // Broadcast to all clients
                    broadcast(JSON.stringify({ action: 'petCreated', data: savedPet }));
                    break;

                case 'updatePet':
                    const { id, updateData } = data;

                    if (!id || !updateData) {
                        ws.send(JSON.stringify({ action: 'error', message: 'ID and update data are required' }));
                        return;
                    }

                    const updatedPet = await Pet.findByIdAndUpdate(id, updateData, { new: true });

                    if (!updatedPet) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Pet not found' }));
                        return;
                    }

                    // If the pet is active, update the active collection too
                    if (updatedPet.active) {
                        await ActivePet.findByIdAndUpdate(id, updateData, { new: true });
                    }

                    // Broadcast to all clients
                    broadcast(JSON.stringify({ action: 'petUpdated', data: updatedPet }));
                    break;

                case 'updatePetStatus':
                    const { petId, active } = data;

                    if (!petId || active === undefined) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Pet ID and status are required' }));
                        return;
                    }

                    const currentPet = await Pet.findById(petId);
                    if (!currentPet) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Pet not found' }));
                        return;
                    }

                    const statusUpdatedPet = await Pet.findByIdAndUpdate(
                        petId,
                        { active: Boolean(active) },
                        { new: true }
                    );

                    if (active) {
                        const activePetData = {
                            _id: currentPet._id,
                            name: currentPet.name,
                            owner: currentPet.owner,
                            age: currentPet.age,
                            sex: currentPet.sex,
                            fixed: currentPet.fixed,
                            out: false,
                            fed: false,
                            currentlyOut: false,
                            cleared: false,
                            dateActivated: new Date()
                        };

                        const existingActivePet = await ActivePet.findById(petId);
                        if (existingActivePet) {
                            await ActivePet.findByIdAndUpdate(petId, activePetData);
                        } else {
                            const newActivePet = new ActivePet(activePetData);
                            await newActivePet.save();
                        }
                    } else {
                        // Remove from active pets collection first
                        await ActivePet.findByIdAndDelete(petId);
                    }

                    // Count active pets AFTER the database operations are complete
                    const activeCount = await Pet.countDocuments({ active: true });

                    // Save log entry with the correct count
                    const logEntry = new Logs({
                        key: currentPet._id,
                        name: currentPet.name,
                        owner: currentPet.owner,
                        active: active,
                        count: activeCount
                    });
                    await logEntry.save();
                    
                    // Broadcast to all clients
                    broadcast(JSON.stringify({ action: 'petStatusUpdated', data: statusUpdatedPet }));
                    break;

                case 'deletePet':
                    const { deleteId } = data;

                    if (!deleteId) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Pet ID is required' }));
                        return;
                    }

                    const deletedPet = await Pet.findByIdAndDelete(deleteId);
                    await ActivePet.findByIdAndDelete(deleteId);

                    if (!deletedPet) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Pet not found' }));
                        return;
                    }

                    // Broadcast to all clients
                    broadcast(JSON.stringify({ action: 'petDeleted', data: { _id: deleteId } }));
                    break;

                case 'updateActivePet':
                    const { activePetId, activeUpdates } = data;

                    if (!activePetId || !activeUpdates) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Pet ID and updates are required' }));
                        return;
                    }

                    const allowedFields = ['out', 'fed', 'currentlyOut', 'cleared', 'currentlyouttimestamp'];
                    const filteredUpdate = {};

                    Object.keys(activeUpdates).forEach(key => {
                        if (allowedFields.includes(key)) {
                            if (key === 'currentlyouttimestamp') {
                                filteredUpdate[key] = activeUpdates[key] ? new Date(activeUpdates[key]) : null;
                            } else {
                                filteredUpdate[key] = Boolean(activeUpdates[key]);
                            }
                        }
                    });

                    const updatedActivePet = await ActivePet.findByIdAndUpdate(
                        activePetId,
                        filteredUpdate,
                        { new: true }
                    );

                    if (!updatedActivePet) {
                        ws.send(JSON.stringify({ action: 'error', message: 'Active pet not found' }));
                        return;
                    }

                    // Broadcast to all clients
                    broadcast(JSON.stringify({ action: 'activePetUpdated', data: updatedActivePet }));
                    break;

                default:
                    ws.send(JSON.stringify({ action: 'error', message: 'Unknown action' }));
            }
        } catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({ action: 'error', message: 'Server error: ' + error.message }));
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// Helper function to broadcast to all clients
function broadcast(message) {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(message);
        }
    });
}

// Keep existing routes for serving HTML files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'createnew.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});