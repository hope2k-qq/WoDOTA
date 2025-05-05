import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

export const ArenaPage = () => {
    const gameRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: gameRef.current ?? undefined,
            physics: { default: 'arcade' },
            scene: {
                preload,
                create,
                update
            },
        };

        const game = new Phaser.Game(config);

        // Функция загрузки ресурсов
        function preload(this: Phaser.Scene) {
            console.log('Начало preload');

            this.load.on('loaderror', (file: any) => {
                console.error('Ошибка загрузки ресурса:', file);
            });

            // Загрузка карты
            this.load.tilemapTiledJSON('arena', '/games/arena.json');
            console.log('Загружаем карту: /games/arena.json');

            // Загрузка тайлсетов
            this.load.image('1', '/games/1.png');
            this.load.image('2', '/games/2.png');
            this.load.image('3', '/games/3.png');
            this.load.image('4', '/games/4.png');
            this.load.image('5', '/games/5.png');

            // Загрузка изображения персонажа
            this.load.image('player', '/games/walk.png'); // Спрайт персонажа
        }

        let player: Phaser.Physics.Arcade.Sprite | null = null;

        // Функция создания объектов на сцене
        function create(this: Phaser.Scene) {
            console.log('Создание карты');

            // Загружаем карту
            const map = this.make.tilemap({ key: 'arena' });
            console.log('Карта загружена:', map);

            // Добавляем тайлсеты
            const tileset1 = map.addTilesetImage('1', '1');
            const tileset2 = map.addTilesetImage('2', '2');
            const tileset3 = map.addTilesetImage('3', '3');
            const tileset4 = map.addTilesetImage('4', '4');
            const tileset5 = map.addTilesetImage('5', '5');

            console.log('Tilesets:', { tileset1, tileset2, tileset3, tileset4, tileset5 });

            if (!tileset1 || !tileset2 || !tileset3 || !tileset4 || !tileset5) {
                throw new Error('❌ Один из тайлсетов не найден');
            }

            // Создаем слои карты
            map.layers.forEach((layer, index) => {
                console.log(`Создание слоя #${index}:`, layer.name);
                map.createLayer(layer.name, [tileset1, tileset2, tileset3, tileset4, tileset5], 0, 0);
            });

            // Добавление персонажа на карту
            player = this.physics.add.sprite(100, 100, 'player'); // Создаем спрайт персонажа
            player.setOrigin(0.5, 0.5); // Центрируем спрайт по центру
            player.setCollideWorldBounds(true); // Персонаж не может выйти за пределы мира
        }

        // Функция обновления игры
        function update(this: Phaser.Scene) {
            if (!player) return;

            // Проверка на null и создание клавиш
            const cursors = this.input?.keyboard?.createCursorKeys();
            if (!cursors) return; // если нет клавиш, выходим из функции

            // Движение персонажа
            if (cursors.left.isDown) {
                player.setVelocityX(-160);
            } else if (cursors.right.isDown) {
                player.setVelocityX(160);
            } else {
                player.setVelocityX(0);
            }

            if (cursors.up.isDown) {
                player.setVelocityY(-160);
            } else if (cursors.down.isDown) {
                player.setVelocityY(160);
            } else {
                player.setVelocityY(0);
            }
        }

        return () => {
            game.destroy(true);
        };
    }, []);

    return <div ref={gameRef} style={{ width: '100%', height: '100%' }} />;
};
