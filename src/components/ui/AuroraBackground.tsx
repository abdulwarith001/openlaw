"use client";

import React, { useEffect, useRef } from "react";

class Blob {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number, color: string) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.radius = Math.random() * 400 + 300;
    this.color = color;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "transparent");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  update(mouse: { x: number; y: number; active: boolean }) {
    if (mouse.active) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 1000;

      if (distance < maxDistance) {
        const force = (maxDistance - distance) / maxDistance;
        this.vx += (dx / distance) * force * 0.02;
        this.vy += (dy / distance) * force * 0.02;
      }
    }

    // Add ambient drift
    this.x += this.vx;
    this.y += this.vy;

    // Friction to prevent infinite acceleration
    this.vx *= 0.99;
    this.vy *= 0.99;

    // Bounds check with wrapping
    if (this.x < -this.radius) this.x = this.canvasWidth + this.radius;
    if (this.x > this.canvasWidth + this.radius) this.x = -this.radius;
    if (this.y < -this.radius) this.y = this.canvasHeight + this.radius;
    if (this.y > this.canvasHeight + this.radius) this.y = -this.radius;
  }
}

export const AuroraBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let blobs: Blob[] = [];
    const mouse = { x: 0, y: 0, active: false };

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      blobs = [
        new Blob(canvas.width, canvas.height, "rgba(255, 214, 0, 0.2)"),  // Primary Yellow (Brighter)
        new Blob(canvas.width, canvas.height, "rgba(255, 191, 0, 0.15)"), // Amber
        new Blob(canvas.width, canvas.height, "rgba(122, 112, 96, 0.18)"), // Muted Tan
        new Blob(canvas.width, canvas.height, "rgba(255, 214, 0, 0.12)"),  // Primary Yellow (Soft)
        new Blob(canvas.width, canvas.height, "rgba(165, 124, 0, 0.1)"),   // Bronze
        new Blob(canvas.width, canvas.height, "rgba(255, 191, 0, 0.1)"),   // Amber (Extra)
      ];
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "screen";
      
      blobs.forEach(blob => {
        blob.update(mouse);
        blob.draw(ctx);
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    init();
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-20 bg-transparent pointer-events-none opacity-80"
      style={{ filter: "blur(80px)" }}
    />
  );
};
