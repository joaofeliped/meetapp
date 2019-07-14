import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from "../../lib/Mail";

class SubscriptionMail {
  get key() {
    return 'SubscriptionMail';
  }

  async handle({ data }) {
    const { meetup, subscriber } = data;

    await Mail.sendMail({
      to: `${subscriber.name} <${subscriber.email}>`,
      subject: 'Nova inscrição de meetup',
      template: 'subscription',
      context: {
        organizer: meetup.organizer.name,
        meetup: meetup,
        user: subscriber.name,
        date: format(parseISO(meetup.date_hour), "'dia' dd 'de' MMMM', às' H:mm'h'", { locale: pt })
      }
    });
  }
}

export default new SubscriptionMail();
