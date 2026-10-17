import { AfterViewInit, Directive, ElementRef, OnDestroy, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

/** Loaded globally through angular.json "scripts" (vendor copies, unchanged). */
declare const gsap: any;
declare const ScrollTrigger: any;

/**
 * Ports the original js/animations.js to a directive.
 *
 * The legacy script ran once on DOMContentLoaded; a single-page app needs the
 * reveals to replay on every navigation, so the same rules run again after each
 * NavigationEnd and ScrollTrigger is refreshed. Elements are tracked so a node
 * is only ever animated once, which keeps the repeated runs idempotent.
 *
 * Degradation is preserved: with reduced motion or without GSAP nothing is
 * hidden and every page stays fully usable.
 */
@Directive({ selector: '[appGsapReveal]', standalone: true })
export class GsapRevealDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly router = inject(Router);
  private readonly reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Elements already revealed, so repeat runs never re-animate a node. */
  private readonly animated = new WeakSet<Element>();

  private subscription?: Subscription;
  private observer?: MutationObserver;
  private anchorHandler?: (event: Event) => void;

  /** Collapses the several triggers that can fire in one tick into a single run. */
  private runScheduled = false;

  ngAfterViewInit(): void {
    this.setupAnchorScroll();

    if (!this.reduceMotion && typeof gsap !== 'undefined') {
      this.observeCards();
      // Initial page: NavigationEnd may already have fired before this runs.
      this.scheduleRun();
    }

    this.subscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.scheduleRun());
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.observer?.disconnect();
    if (this.anchorHandler) document.removeEventListener('click', this.anchorHandler);
  }

  /** Smooth scroll for in-page anchors (independent of GSAP). */
  private setupAnchorScroll(): void {
    this.anchorHandler = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (!link) return;
      const target = document.querySelector(link.getAttribute('href') || '');
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: this.reduceMotion ? 'auto' : 'smooth' });
      }
    };
    document.addEventListener('click', this.anchorHandler);
  }

  /** Cards are painted from API data after render; catch them as they appear. */
  private observeCards(): void {
    this.observer = new MutationObserver(mutations => {
      const added: Element[] = [];
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        const element = node as Element;
        if (element.matches?.('.card')) added.push(element);
        element.querySelectorAll?.('.card').forEach(card => added.push(card));
      }));
      this.animateCards(added);
    });
    this.observer.observe(this.host.nativeElement, { childList: true, subtree: true });
  }

  /** Defers to the next tick so the routed view is painted, but only once per tick. */
  private scheduleRun(): void {
    if (this.runScheduled) return;
    this.runScheduled = true;
    setTimeout(() => {
      this.runScheduled = false;
      this.run();
    });
  }

  private run(): void {
    if (this.reduceMotion || typeof gsap === 'undefined') return;

    const root = this.host.nativeElement;
    const hasScrollTrigger = typeof ScrollTrigger !== 'undefined';
    if (hasScrollTrigger) gsap.registerPlugin(ScrollTrigger);

    const firstSection = root.querySelector('section');
    if (firstSection) {
      this.reveal(
        Array.from(firstSection.querySelectorAll('h1, h2, .hero-subtitle, .theme-card, .btn')),
        { opacity: 0, y: 24, duration: 0.6, ease: 'power2.out', stagger: 0.08 }
      );
    }

    if (hasScrollTrigger) {
      root.querySelectorAll('section:not(:first-of-type) h2').forEach(heading => {
        this.reveal([heading], {
          opacity: 0, y: 24, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: heading, start: 'top 88%', once: true }
        });
      });

      const stats = Array.from(root.querySelectorAll('.stat-item'));
      if (stats.length) {
        this.reveal(stats, {
          opacity: 0, y: 24, duration: 0.6, ease: 'power2.out', stagger: 0.1,
          scrollTrigger: { trigger: stats[0].closest('section') || stats[0], start: 'top 85%', once: true }
        });
      }

      ScrollTrigger.refresh();
    }

    this.animateCards(Array.from(root.querySelectorAll('.card')));
  }

  /** Fades fresh cards up; already-seen cards are skipped. */
  private animateCards(elements: Element[]): void {
    this.reveal(elements, { opacity: 0, y: 16, duration: 0.45, ease: 'power2.out', stagger: 0.06 });
  }

  /**
   * Runs a gsap.from on the elements that have not been revealed yet.
   *
   * clearProps is essential in the SPA: if the tween is interrupted by an
   * Angular re-render the inline "from" styles would otherwise stick, leaving
   * functional controls stuck at opacity 0.
   */
  private reveal(elements: Element[], vars: Record<string, unknown>): void {
    const fresh = elements.filter(element => !this.animated.has(element));
    if (!fresh.length) return;
    fresh.forEach(element => this.animated.add(element));

    gsap.from(fresh, { ...vars, clearProps: 'all' });

    // Bounded failsafe: an entrance animation must never leave real content
    // hidden. If the ticker cannot advance (background/offscreen tab with a
    // throttled rAF) the inline "from" styles would otherwise stick at
    // opacity 0, so strip them unconditionally once the tween is due to be over.
    const duration = (Number(vars['duration']) || 0.5) * 1000;
    const stagger = (Number(vars['stagger']) || 0) * 1000 * fresh.length;
    window.setTimeout(() => gsap.set(fresh, { clearProps: 'all' }), duration + stagger + 600);
  }
}
