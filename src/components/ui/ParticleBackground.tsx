"use client";

import React, { useEffect, useRef } from "react";

class Particle {
  x: number;
  y: number;
  size: number;
  baseX: number;
  baseY: number;
  density: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(x: number, y: number, canvasWidth: number, canvasHeight: number) {
    this.x = x;
    this.y = y;
    this.size = 2.0;
    this.baseX = this.x;
    this.baseY = this.y;
    this.density = Math.random() * 30 + 1;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "rgba(255, 214, 0, 0.4)"; // Primary Yellow with more opacity
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }

  update(mouse: { x: number; y: number; radius: number }) {
    const dx = mouse.x - this.x;
    const dy = mouse.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Attract to mouse (Swarm effect)
    if (distance < mouse.radius && mouse.x !== 0) {
      const forceDirectionX = dx / distance;
      const forceDirectionY = dy / distance;
      const maxDistance = mouse.radius;
      const force = (maxDistance - distance) / maxDistance;
      const directionX = forceDirectionX * force * this.density * 0.8;
      const directionY = forceDirectionY * force * this.density * 0.8;

      this.x += directionX;
      this.y += directionY;
    } else {
      // Return to base position with slight easing
      if (this.x !== this.baseX) {
        const dxBack = this.x - this.baseX;
        this.x -= dxBack / 20;
      }
      if (this.y !== this.baseY) {
        const dyBack = this.y - this.baseY;
        this.y -= dyBack / 20;
      }
    }

    // Add slight ambient vibration
    this.x += (Math.random() - 0.5) * 0.5;
    this.y += (Math.random() - 0.5) * 0.5;
  }
}

export const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: 0, y: 0, radius: 150 };

    const init = () => {
      particles = [];
      const numberOfParticles = (canvas.width * canvas.height) / 4000;
      for (let i = 0; i < numberOfParticles; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        particles.push(new Particle(x, y, canvas.width, canvas.height));
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update(mouse);
        p.draw(ctx);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (event: MouseEvent) => {
      mouse.x = event.x;
      mouse.y = event.y;
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    
    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 bg-transparent pointer-events-none"
    />
  );
};
