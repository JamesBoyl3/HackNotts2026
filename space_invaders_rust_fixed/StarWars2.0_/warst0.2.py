import pygame as py
from pygame import mixer
from pygame.locals import *
import random as ran

py.init()

py.mixer.pre_init(4410, -16, 2, 512)
mixer.init()

clock = py.time.Clock()
fps = 60

screen_width = 600
screen_height = 800

screen = py.display.set_mode((screen_width, screen_height))
py.display.set_caption('Space Invenders')

#load sounds
explosion_fx = py.mixer.Sound('StarWars2.0/explosion.wav')
explosion_fx.set_volume(0.25)

explosion2_fx = py.mixer.Sound('StarWars2.0/explosion2.wav')
explosion2_fx.set_volume(0.25)

laser_fx = py.mixer.Sound('StarWars2.0/laser.wav')
laser_fx.set_volume(0.25)

# Define fonts
font30 = py.font.SysFont('Constantia', 30)
font40 = py.font.SysFont('Constantia', 40)

# Define colors
red = (255,0,0)
green = (0,255,0)
white = (255,255, 255)

#!Define game variables
rows = 5
cols = 5
alien_cooldown = 1000
last_alien_shot = py.time.get_ticks()
countdown = 3
last_count = py.time.get_ticks()
gameover = 0

bg = py.image.load('StarWars2.0/bg.png')

def draw_bg():
    screen.blit(bg, (0,0))
    
#Function for creating text
def draw_text(text, font, text_col, x, y):
    img = font.render(text, True, text_col)
    screen.blit(img, (x, y))

#!Create spaceship(player) class
class Spaceship(py.sprite.Sprite):
    def __init__(self, x, y, health):
        py.sprite.Sprite.__init__(self)
        self.image = py.image.load('StarWars2.0/spaceship.png')
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]
        self.health_start = health
        self.health_remaining = health
        self.last_shot = py.time.get_ticks()
        
    def update(self):
        speed = 8
        # set cool down
        cooldown = 500
        gameover = 0
        
        key = py.key.get_pressed()
        if key[py.K_LEFT] and self.rect.left > 0:
            self.rect.x -= speed
        if key[py.K_RIGHT]and self.rect.right < screen_width:
            self.rect.x += speed
            
        #Record current time
        time_now = py.time.get_ticks()
        
        #Shoot
        if key[py.K_SPACE] and time_now - self.last_shot > cooldown:
            laser_fx.play()
            bullet = Bullets(self.rect.centerx, self.rect.top)
            bullet_group.add(bullet)
            self.last_shot = time_now
            
        #update mask
        self.mask = py.mask.from_surface(self.image)
            
        #Draw health bar
        py.draw.rect(screen, red, (self.rect.x, (self.rect.bottom + 10), self.rect.width, 15))
        if self.health_remaining > 0:
            py.draw.rect(screen, green, (self.rect.x, (self.rect.bottom + 10), int(self.rect.width * (self.health_remaining / self.health_start)), 15))
        elif self.health_remaining <= 0:
            explosion = Explosion(self.rect.centerx, self.rect.centery, 3)
            explosion_group.add(explosion)
            self.kill()
            gameover -= 1
        return gameover 
            
             
#!Create bullets class
class Bullets(py.sprite.Sprite):
    def __init__(self, x, y):
        py.sprite.Sprite.__init__(self)
        self.image = py.image.load('StarWars2.0/bullet.png')
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]
        
    def update(self):
        self.rect.y -= 5 
        if self.rect.bottom < 0:
            self.kill()
        if py.sprite.spritecollide(self, alien_group, True):
            self.kill()
            explosion_fx.play()
            explosion = Explosion(self.rect.centerx, self.rect.centery, 2)
            explosion_group.add(explosion)

#!Create Aliens class
class Aliens(py.sprite.Sprite):
    def __init__(self, x, y):
        py.sprite.Sprite.__init__(self)
        self.image = py.image.load('StarWars2.0/alien' + str(ran.randint(1, 5)) + '.png')
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]
        self.move_counter = 0
        self.move_direction = 1
        
    def update(self):
        self.rect.x += self.move_direction
        self.move_counter += 1
        if abs(self.move_counter) > 75:
            self.move_direction *= -1
            self.move_counter *= self.move_direction
        
#!Create bullets class for aliens
class Aliens_Bullets(py.sprite.Sprite):
    def __init__(self, x, y):
        py.sprite.Sprite.__init__(self)
        self.image = py.image.load('StarWars2.0/alien_bullet.png')
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]
        
    def update(self):
        self.rect.y += 2
        if self.rect.top > screen_height:
            self.kill()
        if py.sprite.spritecollide(self, spaceship_group, False, py.sprite.collide_mask):
            self.kill()
            #reduce spaceship health
            spaceship.health_remaining -= 1
            explosion2_fx.play()
            explosion = Explosion(self.rect.centerx, self.rect.centery, 1)
            explosion_group.add(explosion)
            
#Create explosion class
class Explosion(py.sprite.Sprite):
    def __init__(self, x, y, size):
        py.sprite.Sprite.__init__(self)
        self.images = []
        for num in range(1, 6):
            img = py.image.load(f'StarWars2.0/exp{num}.png')
            if size == 1:
                img = py.transform.scale(img, (20, 20))
            if size == 2:
                img = py.transform.scale(img, (40, 40))
            if size == 3:
                img = py.transform.scale(img, (160, 160))
            #add image to list
            self.images.append(img)
        self.index = 0
        self.image = self.images[self.index]
        self.rect = self.image.get_rect()
        self.rect.center = [x, y]
        self.counter = 0 
        
    def update(self):
        explosion_speed = 3
        # update explosion animation 
        self.counter += 1
        if self.counter >= explosion_speed and self.index < len(self.images) - 1:
            self.counter = 0 
            self.index += 1
            self.image = self.images[self.index]
            
        #if the animation is complete, delete explosion 
        if self.index >= len(self.images) - 1 and self.counter >= explosion_speed:
            self.kill()
            
        

# Create sprite group       
spaceship_group = py.sprite.Group()
bullet_group = py.sprite.Group()
alien_group = py.sprite.Group()
alien_bullet_group = py.sprite.Group()
explosion_group = py.sprite.Group()

#!Generate aliens
def create_aliens():
    for row in range(rows):
        for item in range(cols):
            alien = Aliens(100 + item * 100, 100 + row * 70)
            alien_group.add(alien)
create_aliens()

# create player
spaceship = Spaceship(int(screen_width / 2), screen_height - 100, 3)
spaceship_group.add(spaceship)

run = True
while run:
    clock.tick(fps)
    
    draw_bg()
    
    if countdown == 0:
        #Create random alien bullets
        time_now = py.time.get_ticks()
        mouse = py.mouse.get_pos()

        #shoot
        if time_now - last_alien_shot > alien_cooldown and len(alien_bullet_group) < 5 and len(alien_group) > 0:
            attacking_alien = ran.choice(alien_group.sprites())
            alien_bullet = Aliens_Bullets(attacking_alien.rect.centerx, attacking_alien.rect.bottom)
            alien_bullet_group.add(alien_bullet)
            last_alien_shot = time_now
            
        if len(alien_group) == 0:
            gameover = 1
            
        if gameover == 0:    
            # update sprite groups
            gameover = spaceship.update()
            bullet_group.update()
            alien_group.update()
            alien_bullet_group.update()
        else:
            if gameover >= 1 and gameover <= 0:
                draw_text('GAME OVER!', font40, white, int(screen_width/ 2 - 110), int(screen_height / 2 + 50))
            if gameover >= 1 :
                draw_text('YOU WIN!', font40, white, int(screen_width/ 2 - 110), int(screen_height / 2 + 50))
                draw_text('Tab to space for start!', font30, white, int(screen_width/ 2 - 120), int(screen_height / 2 + 100))
        
        
    if countdown > 0:
        draw_text('GET READY!', font40, white, int(screen_width/ 2 - 110), int(screen_height / 2 + 50))
        draw_text(str(countdown), font40, white, int(screen_width/ 2 - 10), int(screen_height / 2 + 110))
        count_timer = py.time.get_ticks()
        if count_timer - last_count > 1000:
            countdown -= 1
            last_count = count_timer
        
    #update explosion group    
    explosion_group.update()

    # draw sprites groups
    spaceship_group.draw(screen) 
    bullet_group.draw(screen) 
    alien_group.draw(screen) 
    alien_bullet_group.draw(screen)  
    explosion_group.draw(screen)
    
    for event in py.event.get():
        if event.type == py.QUIT:
            run = False
            
    py.display.update()


py.quit()

